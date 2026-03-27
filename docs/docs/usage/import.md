---
sidebar_position: 3
---

# Import Test Cases

UnitTCMS supports importing test cases from Excel files (`.xlsx`, `.xls`). You can import test cases into any folder using the import feature.

## Supported Formats

Two Excel formats are supported. The format is automatically detected based on the column headers.

### v1.1 Format (Default)

This is the original UnitTCMS import format where **each row represents one step** of a test case. Rows sharing the same `title` are grouped into a single test case with multiple steps.

| Column | Required | Description |
|---|---|---|
| `title` | Yes | Test case title. Repeat the same title for multi-step cases. |
| `description` | No | Test case description |
| `priority` | Yes | `critical`, `high`, `medium`, or `low` |
| `type` | Yes | `security`, `performance`, `smoke-and-sanity`, `regression`, `other` |
| `template` | Yes | `text` or `step` |
| `preConditions` | No | Preconditions for the test case |
| `expectedResults` | No | Overall expected result for the test case |
| `automationStatus` | No | `automation-not-required`, `not-automated`, `automated` |
| `step` | No | Step description (one per row) |
| `expectedStepResult` | No | Expected result for the individual step |

**Example:**

| title | description | priority | type | template | step | expectedStepResult |
|---|---|---|---|---|---|---|
| Login test | Verify login flow | high | smoke-and-sanity | step | Open login page | Login page appears |
| Login test | Verify login flow | high | smoke-and-sanity | step | Enter credentials | Fields populated |
| Login test | Verify login flow | high | smoke-and-sanity | step | Click submit | User is logged in |
| Search test | Verify search | medium | regression | text | | |

### Reference Format

This format is common in QA teams and testing tools. **Each row represents one complete test case**. Steps are written as multiple lines inside a single cell.

| Column | Required | Description |
|---|---|---|
| `Test Scenario` or `title` | Yes | Test case title |
| `Test Case ID` | No | Identifier (included in description) |
| `Module` | No | Module name — creates a sub-folder automatically |
| `Test Steps` or `step` | No | Multiline steps in a single cell (see below) |
| `Expected Result` or `expectedResults` | No | Overall expected result |
| `Priority` or `priority` | No | `critical`, `high`, `medium`, or `low` (defaults to `medium`) |
| `Type` or `type` | No | Test type (defaults to `other`) |
| `Pre - Condition` or `preConditions` | No | Preconditions |
| `Test Data` | No | Test data (included in description) |
| `Comments` | No | Comments (included in description) |

**Step Formatting:**

Steps inside a single cell can be written as:

- **Numbered**: Each step prefixed with a number (the prefix is stripped automatically)
  ```
  1. Open the application
  2. Navigate to settings
  3. Click save
  ```
- **Plain lines**: Each line becomes a separate step
  ```
  Open the application
  Navigate to settings
  Click save
  ```

**Example:**

| Test Case ID | Module | Test Scenario | Test Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| TC-001 | Login | Verify login | 1. Open app\n2. Enter credentials\n3. Click login | User is logged in | high |
| TC-002 | Search | Verify search | 1. Type keyword\n2. Press enter | Results are shown | medium |

## Multi-Sheet Import

When an Excel file contains **multiple sheets**, each sheet is treated as a separate folder:

- Each sheet name becomes a **sub-folder** under the target folder.
- If the reference format is used and rows contain a `Module` column, modules become **nested sub-folders** under the sheet folder.

**Folder hierarchy example:**

```
Target Folder (selected in UI)
├── Sheet 1 Name/
│   ├── Module A/
│   │   ├── Test Case 1
│   │   └── Test Case 2
│   └── Module B/
│       └── Test Case 3
└── Sheet 2 Name/
    ├── Module C/
    │   └── Test Case 4
    └── Test Case 5 (no module)
```

For a **single-sheet** file, no extra folder is created — test cases go directly into the selected folder (backward compatible).

## Module to Folder Mapping

When using the reference format with a `Module` column:

- Unique module names are extracted from all rows.
- A folder is created for each unique module name (using `findOrCreate`, so existing folders are reused).
- Each test case is placed in its corresponding module folder.
- Test cases without a module value stay in the sheet/target folder.

## Reference Excel Templates

Two reference templates are provided in the [`reference/`](https://github.com/kimatata/unittcms/tree/main/reference) directory:

- **`unittcms-import-template-v1.1.xlsx`** — Template for the v1.1 format
- **`unittcms-import-template-reference-v1.2.xlsx`** — Template for the reference format with Module support

Download these templates to get started quickly.

## API Endpoint

```
POST /cases/import?folderId={folderId}
Content-Type: multipart/form-data
```

**Parameters:**
- `folderId` (query, required) — The target folder ID to import test cases into
- `file` (form-data, required) — The Excel file (`.xlsx` or `.xls`, max 50 MB)

**Authentication:** Required (must be a project developer or above)
