# Multi-sheet Excel import: preview, partial success, and re-import upsert

## Problem

`POST /cases/import` currently parses every sheet of the uploaded workbook, but
the first invalid row anywhere aborts the entire request with a single error
string (`res.status(400)`). A 40-row sheet with one bad row imports nothing.
Multi-sheet workbooks have no way to accept the sheets that are fine while
fixing the ones that aren't, and there's no way to re-upload a corrected sheet
without duplicating every case that already imported successfully.

## Goals

- A bad row in one sheet must not block the other valid rows in that sheet,
  or other sheets in the same workbook.
- Show the user, per sheet: what would be created/updated, and exactly which
  rows failed and why — before anything is written to the database.
- Let the user accept or skip each sheet (not each row) before committing.
- Support re-uploading a workbook: a row whose Test Case ID matches an
  existing case (anywhere in the project) updates that case in place —
  including replacing its steps — instead of creating a duplicate.

## Non-goals

- Per-row accept/reject in the review UI (sheet-level only, per explicit ask).
- Cross-project matching (Test Case ID match is scoped to the project being
  imported into).
- A server-side session/cache store. The preview payload round-trips through
  the client.

## Data model change

Add to `Case` (migration `add-column-external-id-to-cases`):

```js
externalId: {
  type: DataTypes.STRING,
  allowNull: true,
}
```

Nullable, indexed (non-unique — first-time data can be messy; matching stays
an application-level "first match wins" lookup, not a DB constraint). Rows
with no Test Case ID always create a new case, exactly like today.

## Backend

Two routes replace the current single `POST /cases/import`, sharing the
existing parsing helpers in `backend/routes/cases/import.js`:

### `POST /cases/import/preview`

Same multipart upload as today (`file`, `folderId` query param). For each
sheet:

1. Resolve the sheet's target folder **name** (sheet name if multi-sheet,
   the target folder itself if single-sheet) — folders are not created yet.
2. Parse rows into cases using the existing per-format parsers
   (`_parseV1Format` / `_parseReferenceFormat`), but validation now happens
   **per case**, not per sheet: a failing case is recorded with its error and
   row number(s) and excluded from the sheet's importable cases; parsing
   continues to the next case in the sheet.
3. For each valid case with a non-empty Test Case ID, look up an existing
   `Case` in the same project with a matching `externalId`. Tag the case
   `new` or `update` (+ matched case id) accordingly. Cases with no Test Case
   ID are always `new`.
4. A duplicate Test Case ID *within the same sheet* is a validation error on
   the second (and later) occurrence.

No database writes happen in this step (aside from the read-only project/
folder-name lookups needed to build the response).

Response shape:

```json
{
  "sheets": [
    {
      "sheetName": "Login",
      "targetFolderName": "Login",
      "summary": { "total": 12, "new": 8, "update": 3, "failed": 1 },
      "cases": [
        {
          "rowNumbers": [2],
          "status": "new",
          "title": "...",
          /* ...every field the commit step needs to create/update the case... */
        },
        {
          "rowNumbers": [7],
          "status": "update",
          "matchedCaseId": 42,
          "title": "...",
          "..."
        },
        {
          "rowNumbers": [9],
          "status": "error",
          "errors": ["Row 9 is missing required field: priority"]
        }
      ]
    }
  ]
}
```

Structural failures (invalid `.xlsx`, zero sheets, missing `folderId`, folder
not found) remain hard `400`s — there's nothing partial to salvage there.

### `POST /cases/import/commit`

Body: `{ "folderId": ..., "sheets": [ /* the subset of preview sheets the user kept enabled, verbatim */ ] }`

The frontend doesn't re-upload the file — it echoes back the exact sheet
objects from the preview response for whichever sheets stayed checked. Only
`new`/`update` cases are ever present in what gets sent (the UI never lets an
`error` case through, and re-validates nothing further — preview already
validated it moments ago, aligned with this project's existing patterns of
trusting caller-supplied input within an authenticated request).

In one transaction: create/find each sheet's target folder (and module
sub-folders, same as today), then for each case:

- `new` → create the case + its steps, same as today's flow, storing
  `externalId` if the row had a Test Case ID.
- `update` → overwrite every case field from the sheet data (full replace,
  not merge), delete the case's existing steps, insert the sheet's steps.

## Frontend

`CaseImportDialog` gains a second stage instead of upload → immediate
success/error:

1. **Upload stage** (unchanged UI) — file picked, `POST /import/preview`.
2. **Review stage** — one card per sheet: target folder name, counts (new /
   update / failed), a collapsible list of failed rows (row number + reason),
   and an "include this sheet" toggle (checked by default, unchecked
   automatically if it has zero importable cases). An "Import Selected"
   button posts the toggled-on sheets' data to `/import/commit`.

The preview response is held in React state between stages; nothing is
re-parsed or re-uploaded for commit.

## Format changes

- Reference format: no change, `Test Case ID` column already exists and maps
  to `externalId`.
- v1.1 format: add a `testCaseId` column, read once per case's row-group
  (alongside `title`/`priority`/etc. on the group's first row) and mapped to
  `externalId`.
- Both downloadable templates
  (`frontend/public/template/unittcms-import-template-v1.xlsx` and `-v1.1.xlsx`)
  get the new column added with a short example value.

## Testing

Rewrite `backend/routes/cases/import.test.js` around the preview/commit
split:

- A sheet with one invalid row alongside valid rows: preview reports the
  valid rows as `new`/`update` and the bad row as `error`; commit only
  writes the valid rows.
- Re-importing a sheet where a row's Test Case ID matches an existing case:
  preview tags it `update` with the right `matchedCaseId`; commit overwrites
  the case's fields and replaces its steps (old steps gone, new steps
  present).
- A row with no Test Case ID is always `new`, even on repeated import.
- Duplicate Test Case ID within one sheet: second occurrence is an `error`.
- Multi-sheet, multi-format, and module-subfolder behavior from the existing
  test suite carries over, adapted to call `/preview` then `/commit`.

## Breaking change

This replaces `POST /cases/import` outright — no backward-compat shim. The
project is pre-1.0 and the user asked for this exact flow; old frontend/API
callers of the single-shot endpoint stop working and must move to the two-step
flow in this same change.
