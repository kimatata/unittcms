# UnitTCMS — Claude Working Guide

Open-source self-hosted test case management system. Full-stack TypeScript monorepo: Next.js 14 frontend + Express/PostgreSQL backend.

---

## Running the project

**Only the PostgreSQL database runs in Docker. The frontend and backend run locally with hot reload.**

### Start the database (Docker)
```powershell
docker-compose -f docker-compose.yaml up -d postgres
```

### Start the backend (local, hot reload)
```powershell
cd backend && npm run dev
```

### Start the frontend (local, hot reload — Turbopack)
```powershell
cd frontend && npm run dev
```

App available at: `http://localhost:8000/en/projects`

> **Local `node_modules` exist** in both `frontend/` and `backend/`. Run `npm install` inside each folder after adding packages.

> **Sequelize migrations** do NOT run automatically in local dev mode. After adding migration files, run them manually:
> ```powershell
> cd backend
> $env:DATABASE_URL="postgresql://unittcms:unittcms_secret@localhost:5432/unittcms"; npx sequelize-cli db:migrate
> ```
> (migrations only run automatically inside Docker via `entrypoint.js`)

Key env vars (in `docker-compose.yaml` for the DB container):
- `DATABASE_URL=postgresql://unittcms:unittcms_secret@localhost:5432/unittcms`
- Backend reads `DATABASE_URL` from its env to connect to the local Postgres

### Production / Docker-only build (for verification or deployment)
The full Docker build compiles the frontend and serves both frontend+backend from one container on port 8000. Only use this to verify TypeScript compiles cleanly or for production deploys — not for daily development.
```powershell
# Full rebuild (verification / production)
docker-compose -f docker-compose.yaml up --build -d
```

---

## Architecture overview

```
unittcms/
├── frontend/          # Next.js 14 App Router (TypeScript)
├── backend/           # Express.js + Sequelize + SQLite
├── e2e/               # Playwright end-to-end tests
├── entrypoint.js      # Combines backend (/api) + frontend at startup
├── Dockerfile         # Multi-stage: deps → build → runner
└── docker-compose.yaml
```

### Key features implemented
- **Automation tab** (`/projects/:id/automation`) — connects a project to a GitLab or GitHub repo, generates Playwright/Cypress/pytest stub test files from the test case hierarchy, pushes via provider API. Config stored in `automationConfigs` table. Routes: `backend/routes/automationConfigs/`. Control: `frontend/utils/automationConfigControl.ts`.
- **Integrations tab** (`/projects/:id/integrations`) — per-project API key management. One row per `(projectId, service)` in `IntegrationConfigs` table. Keys are masked on read (`***ef45`). Currently supports: Anthropic (single apiKey), GitHub (token + instanceUrl + namespace), GitLab (token + instanceUrl + namespace). Extra fields stored in `settings` JSON TEXT column. Control: `frontend/utils/integrationConfigControl.ts`. Types: `frontend/types/integrations.ts`.
- **AI auto-fix for CI failures** — `GET /automation-configs/:id/run-errors` fetches the latest GitHub Actions run, downloads failed job logs, parses Playwright/pytest/Cypress failures into `[{ id, jobId, testName, filePath, errorText }]`. `POST /automation-configs/:id/fix-error` loads Anthropic key from IntegrationConfigs, fetches file from GitHub, calls `claude-sonnet-4-6`, extracts code, commits fix back to GitHub. AutomationPage shows each error with a "Fix with AI" button.
- **Auto-fix setting** — `autoFixEnabled` boolean on `AutomationConfigs` (default false). Toggle in Settings page (`/projects/:id/settings`). When ON, AutomationPage automatically fires all fix calls when a CI run transitions to failure status.

### Request flow
- All `/api/*` requests → Express backend
- Everything else → Next.js standalone server
- Both served on port 8000 via `entrypoint.js`

### Database
- **PostgreSQL** (default) via `DATABASE_URL` env var — runs as a separate `postgres:16-alpine` service in Docker
- SQLite fallback when `DATABASE_URL` is not set (useful for local dev without Docker)
- Sequelize ORM with numbered migrations in `backend/migrations/`
- Never edit the DB file directly — use migrations
- DB data persisted in `pg-data` Docker volume

---

## Backend (`backend/`)

**Entry**: `index.js` → `server.js` (Express app setup, route registration)

**Data layer** (Repository Pattern):
- `backend/db/index.js` — initializes Sequelize (Postgres or SQLite), loads all models, runs `associate()`, returns `{ sequelize, models, Op }`
- `backend/repositories/index.js` — maps model aliases to `db.repos.*`: `db.repos.users`, `db.repos.projects`, etc.
- `server.js` uses top-level `await initDb()` then spreads `repos` onto the `db` object passed to all routes

**Route pattern** — every route file exports a factory function receiving `db`:
```js
export default function(db) {
  const { verifySignedIn } = authMiddleware(db);
  router.put('/:id', verifySignedIn, async (req, res) => {
    const item = await db.repos.projects.findByPk(req.params.id);
  });
  return router;
}
```

**Available on `db`:**
- `db.repos.users` / `db.repos.projects` / `db.repos.folders` / `db.repos.cases` etc. — Sequelize model instances
- `db.models.User` / `db.models.Project` etc. — same models by class name (for `include:` clauses)
- `db.sequelize` — the Sequelize instance (for transactions, literals, etc.)
- `db.Op` — Sequelize operators

**Middleware** (`backend/middleware/`):
- `auth.js` — `verifySignedIn` (JWT Bearer), `verifyAdmin` — accepts `db`
- `verifyEditable.js` — permission checks for edit operations — accepts `db`
- `verifyVisible.js` — read permission checks — accepts `db`

**Models** (`backend/models/`): Sequelize model definitions. Every model has an explicit `tableName` option and an `associate(models)` method. Associations are set up once centrally by `db/index.js`.
Key models: `users`, `projects`, `folders`, `cases`, `runs`, `runCases`, `members`, `tags`, `caseTags`, `steps`, `comments`, `attachments`, `automationConfigs`, `integrationConfigs`

**Adding a new endpoint:**
1. Create `backend/routes/<resource>/<action>.js`
2. Register it in `backend/server.js` passing `db`

**Route registration gotcha**: register without `/api` prefix — `entrypoint.js` adds that at the proxy layer:
```js
// ✓ correct
app.use('/my-resource', myRoute(db));
// ✗ wrong — results in /api/api/my-resource
app.use('/api/my-resource', myRoute(db));
```

**`router` scope**: `const router = express.Router()` is defined at module scope (outside the exported factory function). This is the established pattern — do not move it inside the function.

---

## Frontend (`frontend/`)

### Path alias
`@/` maps to the `frontend/` root (not `frontend/src/`).
- `@/types/run` → `frontend/types/run.ts`
- `@/utils/TokenProvider` → `frontend/utils/TokenProvider.tsx`
- `@/components/DeleteConfirmDialog` → `frontend/components/DeleteConfirmDialog.tsx`
- `@/src/i18n/routing` → `frontend/src/i18n/routing.ts`

### Server vs client components
| Server component (default) | Client component (`'use client'`) |
|---|---|
| `page.tsx`, `layout.tsx` | `*Page.tsx`, `*Table.tsx`, `*Dialog.tsx` |
| Calls `useTranslations()` / `getTranslations()` | Receives `messages` as prop |
| No interactivity | All state, effects, event handlers |

**Pattern for every page:**
```
[locale]/feature/page.tsx          ← server: collects translations, builds typed messages object
[locale]/feature/FeaturePage.tsx   ← client: 'use client', state, API calls, renders table/dialogs
[locale]/feature/FeatureTable.tsx  ← client: renders HeroUI Table, dropdown actions
[locale]/feature/FeatureDialog.tsx ← client: HeroUI Modal for create/edit
[locale]/feature/featureControl.ts ← API layer: fetch wrappers with Bearer token
```

### Internationalization (next-intl)
- 5 locales: `en` (default), `de`, `ja`, `zh-CN`, `pt-BR`
- Message files: `frontend/messages/{locale}.json`
- All routes are prefixed: `/en/...`, `/de/...`, etc.
- **Always add new translation keys to all 5 locale files**
- Use `Link`, `useRouter` from `@/src/i18n/routing` (not from `next/navigation`)

**Adding a new message key:**
1. Add to `frontend/messages/en.json` under the appropriate namespace
2. Add to all other 4 locale files (translate appropriately)
3. Add to the TypeScript message type in `frontend/types/`
4. Add to the messages object in `page.tsx`
5. Pass to the client component as a prop

### Auth & token
- Context: `TokenContext` from `@/utils/TokenProvider`
- Token stored in `localStorage` under key `unittcms-auth-token`
- Token shape: `{ access_token: string, expires_at: number, user: { id, email, username, role, avatarPath, locale } }`
- JWT extraction: `context.token.access_token` — pass this string to every API control function
- Role checks (all in `TokenContext`):
  - `context.isSignedIn()` — any authenticated user
  - `context.isAdmin()` — global admin
  - `context.isProjectOwner(projectId)` — project owner
  - `context.isProjectManager(projectId)` — manager or above
  - `context.isProjectDeveloper(projectId)` — developer or above
  - `context.isProjectReporter(projectId)` — reporter or above (can modify runs)
- **`context.refreshProjectRoles()`** — call this after creating a new project so the user's roles list includes the new project. Without it, `isProjectOwner` etc. return false for the new project until next page load.

### API calls (frontend)
- Base URL: `Config.apiServer` (resolves to `/api`). Import: `import Config from '@/config/config'`
- Always use Bearer token: `Authorization: Bearer ${jwt}`
- Pattern: async function in `utils/*Control.ts` or co-located `*Control.ts`
- **Exception**: runs control is co-located, not in `utils/`: `frontend/src/app/[locale]/projects/[projectId]/runs/runsControl.ts`
- Error handling: `import { logError } from '@/utils/errorHandler'` — call `logError('context string', error)` in catch blocks
- **Gotcha**: `Config.apiServer` already resolves to `/api`. Use `${Config.apiServer}/resource` — never `${Config.apiServer}/api/resource`.

### Notifications (addToast)
`addToast` is a function exported by `@heroui/react`. Use it for success/error feedback after mutations:
```ts
import { addToast } from '@heroui/react';
addToast({ title: 'Success', description: messages.saved, color: 'success' });
addToast({ title: 'Error', description: messages.failed, color: 'danger' });
```

### Delete confirmation dialog
Use `DeleteConfirmDialog` from `@/components/DeleteConfirmDialog` for all destructive actions:
```tsx
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

<DeleteConfirmDialog
  isOpen={isDeleteDialogOpen}
  onCancel={() => setIsDeleteDialogOpen(false)}
  onConfirm={handleDelete}
  closeText={messages.close}
  confirmText={messages.areYouSure}
  deleteText={messages.delete}
/>
```
Toggle with a `isDeleteDialogOpen` boolean state. Store the ID to delete in a ref or state.

### Navigation helpers
- `Link`, `useRouter`, `usePathname` — always import from `@/src/i18n/routing`, not from `next/navigation`
- `NextUiLinkClasses` — also exported from `@/src/i18n/routing`; apply as `className={NextUiLinkClasses}` on `<Link>` elements inside tables for consistent styled links
- `useFormGuard(isDirty, confirmText, ignorePathPatterns?)` from `@/utils/formGuard` — warns users about unsaved changes when navigating away. `isDirty` is a boolean; set it to `true` when the form has unsaved changes.

### UI library: HeroUI
All UI components come from `@heroui/react`. Key components used throughout:
`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Modal`/`ModalContent`/`ModalHeader`/`ModalBody`/`ModalFooter`, `Table`/`TableHeader`/`TableColumn`/`TableBody`/`TableRow`/`TableCell`, `Dropdown`/`DropdownTrigger`/`DropdownMenu`/`DropdownItem`, `Tooltip`, `Badge`, `Popover`, `Divider`, `addToast`

Icons come from `lucide-react`.

### Types (`frontend/types/`)
Not under `src/`. Key files:
- `project.ts` — `ProjectType`, `ProjectsMessages`, `ProjectDialogMessages`
- `run.ts` — `RunType`, `RunCaseType`, `RunsMessages`, `RunMessages`
- `case.ts` — `CaseType`
- `user.ts` — `UserType`, `TokenContextType`, `TokenType`
- `folder.ts` — `FolderType`, `TreeNodeData`
- `integrations.ts` — `IntegrationConfigType`, `IntegrationsMessages`

---

## Key conventions

### Adding a new feature to an existing page
1. Backend: check if the API endpoint already exists before creating a new one
2. Frontend type: add new message keys to the `*Messages` type
3. Locale files: update all 5 JSON files
4. `page.tsx`: add message keys to the messages object
5. Client component: use new messages and add handlers
6. Rebuild Docker to see changes

### Table with actions (dropdown pattern)
See `RunsTable.tsx` as the canonical example:
- Header column: `{ name: messages.actions, uid: 'actions', sortable: false }`
- `renderCell` switch case for `'actions'`: renders `<Dropdown>` with `<DropdownTrigger>` (MoreVertical icon) + `<DropdownMenu>`
- Disabled items use `disabledKeys` array (e.g., when user lacks permissions)

### Dialog (create + edit reuse)
See `ProjectDialog.tsx` as the canonical example:
- Single dialog for both create and update
- `editingProject: T | null` prop — null = create mode, populated = edit mode
- `useEffect` resets form fields when `editingProject` changes
- Button label: `editingProject ? messages.update : messages.create`

### Shared context between layout panes (ResizablePanes)
When state in the left pane (RunEditor) needs to be visible in the right pane (page.tsx):
- Create a `*Context.tsx` client file with provider + hook
- Wrap `ResizablePanes` in the provider inside `layout.tsx`
- Server-side labels passed as props to the provider
- Right-pane `page.tsx` must be `'use client'` to consume context
See `runs/[runId]/RunContext.tsx` as the example.

### Permissions: when to gate UI
- Destructive actions (delete, edit): check ownership/role, use `isDisabled` on buttons/dropdown items
- `isProjectReporter()` → can modify runs and test case statuses
- `isProjectOwner()` → can edit/delete the project itself

---

## Testing

```powershell
npm run test          # Vitest unit tests
npm run coverage      # Coverage report
npm run e2e           # Playwright E2E (requires running app)
npm run lint          # ESLint check
npm run format:check  # Prettier check
npm run format        # Auto-format
```

Unit tests are co-located next to the files they test (`*.test.ts`).
E2E tests live in `e2e/` and cover full user workflows.

---

## Common tasks quick-reference

| Task | What to do |
|---|---|
| Add field to existing model | Add migration file in `backend/migrations/`, update model in `backend/models/` (add `tableName` option) |
| Add new API endpoint | Create `backend/routes/<resource>/<verb>.js` using `export default function(db)`, register in `backend/server.js` |
| Add new model | Create `backend/models/xxx.js`, add to `backend/repositories/index.js` |
| Add new page | Create `page.tsx` (server) + `FeaturePage.tsx` (client) under `[locale]/...` |
| Add translation key | Edit `messages/en.json` and `messages/he.json` + the TypeScript type + `page.tsx` messages object |
| See changes | `docker-compose -f docker-compose.yaml up --build -d` |
| Force clean rebuild (cache miss) | `docker-compose -f docker-compose.yaml build --no-cache && docker-compose -f docker-compose.yaml up -d` |
| View logs | `docker logs unittcms-unittcms-1 -f` |
| Access container shell | `docker exec -it unittcms-unittcms-1 sh` |

---

## End of session
At the end of each session, update this file (the "Recent additions" section and any
relevant architecture notes) and the memory files in
`C:\Users\shira\.claude\projects\c--Documents-Projects-unittcms\memory\`
to reflect what was built or changed.

---

## Recent additions (2026-06-09, session 4)

### Sprint Flow — new feature tab

A full new tab at `/projects/:id/sprint` that visualizes active feature branches, generates test plans with Claude, and links them to a UnitTCMS test run.

**New DB tables (migrations `20260609000001–2`):**
- `sprintConfigs` — per `automationConfigId`: `keyBranchPatterns` (JSON array TEXT), `sprintBranchPattern`, `jiraBaseUrl`, `jiraProjectKey`, `branchTicketRegex`
- `sprintFlows` — per sprint: `title`, `baseBranch`, `versionBranch`, `testRunId`, `status` (active/draft/testing/done/archived), `branchSnapshot` (JSON TEXT), `nodePositions` (JSON TEXT), `testPlanDraft` (JSON TEXT), `generationPrompt`, `generationLogs` (JSON TEXT)

**New models:** `backend/models/sprintConfigs.js`, `backend/models/sprintFlows.js`. Both registered in `backend/repositories/index.js`.

**New backend routes** (`/sprint` prefix, registered in `server.js`):
- `GET  /sprint/config?automationConfigId=X` — returns sprint config (defaults if none saved)
- `POST /sprint/config` — upsert sprint config (key branches, Jira settings, ticket regex)
- `GET  /sprint/detect?automationConfigId=X` — scans test repo for feature branches vs key branches; returns `{ featureBranches, newBranchCount, newBranches, detectedVersionBranch, hasNewBranches }`
- `POST /sprint/start` — creates sprint flow: fetches branches + PRs, snapshots them with ticket IDs, creates a UnitTCMS test run, returns `{ flow, testRunId }`
- `GET  /sprint/flows?automationConfigId=X` — list last 20 sprint flows
- `GET  /sprint/flows/:flowId` — load flow with live branch/PR state overlaid on snapshot
- `PATCH /sprint/flows/:flowId/positions` — persist node drag positions
- `GET  /sprint/flows/:flowId/generate/prepare` (SSE) — AI pipeline: fetches diffs for each branch → calls Claude → streams `log` events with pipeline steps → saves `testPlanDraft` on flow → sends final `done` event with draft
- `PATCH /sprint/flows/:flowId/draft` — save edited draft (moves status to `draft`)
- `POST /sprint/flows/:flowId/approve` — bulk-creates folders, test cases (with steps), and `RunCase` entries in the sprint test run; moves status to `testing`

**`backend/routes/sprint/_gitHelpers.js`** — shared helpers: `ghRequest`, `glRequest`, `inferApiBase`, `fetchBranches`, `fetchOpenPRs`, `inferTicketId`

**New frontend (`frontend/src/app/[locale]/projects/[projectId]/sprint/`):**
- `page.tsx` (server) + `SprintPage.tsx` (client) — main sprint page, detection banner, "New Sprint Flow" dialog, flow list
- `SprintBoard.tsx` — `@xyflow/react` board rendering branch nodes, version-branch node, test-plan node
- `nodes/BranchNode.tsx`, `TicketNode.tsx`, `TestPlanNode.tsx`, `VersionBranchNode.tsx` — custom React Flow node components
- `detail/DetailPanel.tsx`, `BranchDetail.tsx`, `GenerationPipeline.tsx`, `PipelineTaskRow.tsx`, `TestPlanReview.tsx` — slide-in detail panel: branch details, SSE-driven generation pipeline display, editable draft test plan reviewer

**`frontend/utils/sprintControl.ts`** — API control functions for all sprint endpoints.

**New types in `frontend/types/project.ts`:**
- `SprintBranchInfo`, `SprintFlowStatus`, `SprintFlow`, `SprintDraftCase`, `SprintDraftFolder`, `SprintGenerationLogEntry`, `SprintDetectResult`, `SprintConfig`, `SprintMessages`
- `sprint: string` added to `ProjectMessages`

**New locale namespace `Sprint`** in `en.json` + `he.json` — ~50 keys covering all Sprint UI labels.

**`frontend/package.json`** — added `@xyflow/react ^12.11.0` for the branch visualization board.

**Sidebar + layout** — Sprint tab added with `sprint` icon to `Sidebar.tsx` and `layout.tsx`.

### Monitor page simplification
`MonitorPage.tsx` refactored: removed commit timeline, activity log, health bar stats, and commit sync button. Now shows only source repo config form + test health matrix.

---

## Recent additions (2026-06-09, session 3)

### Bug fixes

- **`backend/middleware/auth.js`** — `verifySignedIn` crashed with 500 when the `Authorization` header was absent (root cause: `authHeader.split()` called on `undefined`). Fixed with `authHeader?.split()` so a missing header returns 401 `Access denied` instead.
- **`backend/routes/automationConfigs/testHealth.js`** — queried `status` on the `runs` table but the column is named `state`. Fixed `attributes: ['id', 'name', 'state', 'updatedAt']`. Caused a 500 on every `GET /:id/test-health` request.
- **`frontend/types/project.ts`** — `TestHealthRun.status` renamed to `TestHealthRun.state` to match the column fix above.
- **`backend/routes/automationConfigs/analyzeCommit.js`** — Anthropic API errors (e.g. low credit balance) were caught by the generic catch block and returned as raw 500 with the SDK's JSON string. Now wrapped in a dedicated try/catch: parses `error.message` JSON to extract the human-readable `error.error.message`, logs to `syncLogs`, and returns 422 so the frontend can display it cleanly.
- **`frontend/src/app/[locale]/projects/[projectId]/monitor/MonitorPage.tsx`** — `handleAnalyzeCommit` error toast was showing only the generic `analyzeCommitError` label. Added `description: err instanceof Error ? err.message : undefined` so server-side messages like "Your credit balance is too low" appear directly in the toast.

---

## Recent additions (2026-06-09, session 2)

### Repo connection flow — browse & pick from GitHub/GitLab
- **`GET /integration-configs/list-repos?projectId=X&service=github`** — new route in `backend/routes/integrationConfigs/listRepos.js`. Loads the user's token from `IntegrationConfigs`, calls GitHub `/user/repos` or GitLab `/projects?membership=true`, paginates up to 500 repos. Returns normalized `[{ id, name, fullName, url, isPrivate, description }]`.
- **`backend/migrations/20260608000004`** — adds `sourceProvider` (STRING(20), nullable) to `automationConfigs`.
- **`backend/models/automationConfigs.js`** — added `sourceProvider` field.
- **`backend/routes/automationConfigs/edit.js`** — all fields now optional (conditional `if (x !== undefined)` updates); added `sourceProvider`, `repoUrl`, `repoId` as patchable fields.
- **`backend/routes/automationConfigs/new.js`** — accepts optional `repoUrl`, `repoId` at creation time.
- **`RepoPickerModal.tsx`** — new `'use client'` component. Opens a HeroUI Modal, fetches repos from `listRepos` on open, filters client-side, shows fullName + private badge + description. Click to select.
- **`AutomationPage.tsx`** — Test repo card now has "Create New / Use Existing" toggle. In "Use Existing" mode: read-only name field + Browse button opens `RepoPickerModal`; selecting a repo auto-saves the config with `repoUrl` + `repoId` set. Source repo card has a Source Provider dropdown + Browse button; picking a repo fills owner/name fields (user still saves manually).
- **`frontend/utils/automationConfigControl.ts`** — added `RepoItem` type and `listRepos(jwt, projectId, service)` function; `updateAutomationConfig` data type now all-optional + `repoUrl`/`repoId`/`sourceProvider` fields; `createAutomationConfig` accepts optional `repoUrl`/`repoId`.
- **`frontend/utils/monitorControl.ts`** — `updateSourceRepoConfig` accepts optional `sourceProvider`.
- New locale keys (en + he): `create_new_repo`, `use_existing_repo`, `browse_repos`, `loading_repos`, `search_repos_placeholder`, `no_repos_found`, `pick_repo_title`, `source_provider`.

### Migration gotcha (local dev)
`npx sequelize-cli db:migrate` without `DATABASE_URL` set silently migrates SQLite instead of Postgres and reports "already up to date" — always pass it explicitly:
```powershell
$env:DATABASE_URL="postgresql://unittcms:unittcms_secret@localhost:5432/unittcms"; npx sequelize-cli db:migrate
```

## Recent additions (2026-06-09)

### Sync Tests — bidirectional automation ↔ test plan sync
- **`POST /automation-configs/:id/sync`** — new route in `backend/routes/automationConfigs/syncTests.js`. Reads the connected repo tree, parses annotated and unannotated test functions, then:
  1. Creates missing test cases in the plan from unannotated code tests (with `codeStatus: 'stub'`)
  2. Updates `codeStatus` ('stub'|'implemented') for already-annotated tests (root-cause fix for AUTOMATED badge not appearing — CI scanner is optional, manual Sync now covers this)
  3. Adds stubs to code files for plan cases with no automation code
  4. Tags all implemented cases with the "automated" tag
  5. Commits all file changes in one commit
  - Returns `{ addedToTestPlan, addedToCode, updatedStatus, taggedAutomated, commitUrl }`
  - Supports GitHub + GitLab, Playwright (TS/JS) + pytest
- **`frontend/utils/automationConfigControl.ts`** — added `SyncResult` type and `syncTests(jwt, configId)` function
- **`frontend/types/project.ts`** — added `syncTests, syncing, syncSuccess, syncError, syncResult, viewCommitSync, openInRepo` to `AutomationMessages`

### AutomationPage improvements
- **`AutomationPage.tsx`** — Sync Tests button with `ArrowLeftRight` icon; inline sync result showing `added·stubs·updated·tagged` counts with commit link; coverage progress bar (% implemented); open-in-repo link per implemented case row; fixed empty-state message ("Run and sync" instead of misleading "No implemented tests")
- **`automation/page.tsx`** — 7 new message keys added to messages object

### Automation status filter in test cases table
- **`backend/routes/cases/index.js`** — `codeStatus` query param support: splits comma-separated values and applies `WHERE codeStatus IN (...)` filter
- **`frontend/utils/caseControl.ts`** — `fetchCases()` accepts optional 7th param `codeStatus?: string[]`, appended as `codeStatus=...` query param
- **`TestCaseFilter.tsx`** — added 4-option "Automation Status" dropdown (Automated / Stub / Not Automated / Stale) above Tags filter; `activeCodeStatusFilters` prop; `selectedCodeStatuses` state; 5th param `codeStatuses: string[]` in `onFilterChange`
- **`TestCaseTable.tsx`** — `activeCodeStatusFilters: string[]` prop added; `activeFilterNum` now includes `activeCodeStatusFilters.length`; passes `activeCodeStatusFilters` and 5-arg `onFilterChange` to `TestCaseFilter`
- **`CasesPane.tsx`** — `codeStatusFilter` state + stored in URL params (`?codeStatus=implemented,stub,...`); `refreshCases` reads from `searchParams` (avoids stale closure); `handleFilterChange` passes codeStatuses to `updateUrlParams`; passes `activeCodeStatusFilters={codeStatusFilter}` to `TestCaseTable`
- **`cases/page.tsx`** — 6 new message keys: `automationFilter, selectAutomation, automatedOnly, stubOnly, notAutomated, staleOnly`
- **`frontend/types/case.ts`** — same 6 keys added to `CasesMessages`
- **`frontend/messages/en.json` + `he.json`** — `automation_filter, select_automation, automated_only, stub_only, not_automated, stale_only` added to Cases namespace; sync keys added to Automation namespace

### Monitor tab — backend infrastructure (routes + types, no frontend page yet)
- **`POST /:id/analyze-commit/:sha`** (`analyzeCommit.js`) — loads a stored commit diff, calls Claude (`claude-sonnet-4-6`) with the diff + existing test hierarchy + a sample test file for style reference. Claude returns a `TEST CASES:` section + `TEST CODE:` fenced code blocks. Route creates UnitTCMS test cases in an "AI Generated > {commit}" folder and commits generated test files to the automation repo. Updates `sourceCommit.status` to `done/failed`, logs to `syncLogs`.
- **`POST /:id/webhook`** (`webhook.js`) — receives GitHub push events (via `x-hub-signature-256` HMAC) and GitLab push events (via `x-gitlab-token`). Stores new commits with diffs in `sourceCommits`. Does not require auth (verifies webhook secret instead). Uses `express.raw()` for HMAC verification.
- **`GET /:id/test-health`** (`testHealth.js`) — returns a matrix of `{ runs, folders, matrix }` where `matrix[folderId][runId]` = `{ total, passed, failed, skipped }`. Uses root folder grouping. Input: last 10 runs × all root-level folders for the project.
- **`frontend/utils/monitorControl.ts`** — API control functions: `fetchSourceCommits`, `syncSourceCommits`, `analyzeCommit`, `fetchSyncLogs`, `fetchTestHealth`, `updateSourceRepoConfig`
- **`frontend/types/project.ts`** — added `SourceCommitType`, `SyncLogType`, `TestHealthData` data types; new `MonitorMessages` type covering health bar, source repo config, commit timeline, commit status badges, test health matrix, and activity log sections

### Source commits tracking (backend infrastructure)
- **New model `backend/models/sourceCommits.js`** — `SourceCommit` model: stores commits fetched from a source (application) repo; fields: sha, message, author, committedAt, diff, status (new/analyzing/analyzed/done/failed), aiSummary, generatedTestCaseIds, testCommitSha
- **New model `backend/models/syncLogs.js`** — `SyncLog` model: audit log per sync operation; fields: type (commit_sync/ai_analysis/test_sync/webhook), description, created/updated/orphaned counts, status, errorMessage
- **New route `backend/routes/automationConfigs/sourceCommits.js`**:
  - `GET /:id/source-commits` — list stored commits (last 50)
  - `POST /:id/sync-source-commits` — fetch last 30 commits from source repo (GitHub or GitLab), store new ones with diffs; if `autoAnalyzeCommits` is on, queues them for analysis
- **`backend/models/automationConfigs.js`** — added 5 fields: `sourceRepoOwner`, `sourceRepoName`, `sourceRepoBranch` (default 'main'), `webhookSecret`, `autoAnalyzeCommits` (bool, default false)
- **`backend/repositories/index.js`** — added `sourceCommits` and `syncLogs` to `db.repos.*`
- **Migrations**: `20260608000001` (add fields to automationConfigs), `20260608000002` (create sourceCommits table with unique index on configId+sha), `20260608000003` (create syncLogs table)

### Bug fix: AUTOMATED badge and "implemented" panel not showing
- **Root cause**: `codeStatus` on cases is only set by the CI scanner script (which requires `UNITTCMS_URL`/`UNITTCMS_TOKEN` in GitHub Actions secrets). If CI secrets are not configured, `codeStatus` stays `'none'` forever and neither the AUTOMATED badge nor implemented-cases panel ever populate.
- **Fix**: `syncTests.js` now parses annotated tests and bulk-updates their `codeStatus` even without CI — clicking Sync Tests once populates the correct status from the repo directly.

## Recent additions (2026-06-08)

### Commit-Driven Test Intelligence + Monitor tab

**Goal**: Connect the source project (app under development) to UnitTCMS and the test automation repo so AI can watch commits and generate tests automatically.

**New DB tables + migrations**:
- `sourceCommits` (`20260608000002`) — one row per commit from source repo: sha, diff, status (new/analyzing/done/failed), aiSummary, generatedTestCaseIds, testCommitSha
- `syncLogs` (`20260608000003`) — activity log: type (commit_sync/ai_analysis/test_sync/webhook), description, created count, status
- `automationConfigs` additions (`20260608000001`): `sourceRepoOwner`, `sourceRepoName`, `sourceRepoBranch`, `webhookSecret`, `autoAnalyzeCommits`

**New backend routes** (all under `/automation-configs/:id/`):
- `GET /source-commits` — list stored commits
- `POST /sync-source-commits` — fetch last 30 commits from source repo via GitHub/GitLab API with diffs
- `GET /sync-logs` — activity log
- `POST /analyze-commit/:sha` — AI analysis: reads diff + test hierarchy + sample test file → calls `claude-sonnet-4-6` → creates test cases in UnitTCMS under "AI Generated" folder → commits test code to test repo → updates SourceCommit status
- `POST /webhook` — receives GitHub/GitLab push events with HMAC signature verification
- `GET /test-health` — matrix data: folders × last 10 UnitTCMS test runs with pass/fail/skipped counts

**New frontend**:
- Monitor tab: `frontend/src/app/[locale]/projects/[projectId]/monitor/` — 4 panels: health bar, commit coverage timeline, test health matrix, activity log
- `frontend/utils/monitorControl.ts` — API control functions
- Types: `SourceCommitType`, `SyncLogType`, `TestHealthData`, `MonitorMessages` in `frontend/types/project.ts`
- Sidebar: Monitor tab with `MonitorDot` icon
- Automation tab: Source Repo Config section (owner/name/branch inputs + auto-analyze toggle)
- Locale: `Monitor` namespace added to `en.json` and `he.json`

**AI analysis flow** (`analyzeCommit.js`):
1. Load commit diff from DB
2. Load test hierarchy (folders + cases) from UnitTCMS DB
3. Fetch sample test file from test repo for style reference
4. Call Claude with diff + hierarchy + sample → parse `TEST CASES:` list + `TEST CODE:` file blocks
5. Create test cases under `AI Generated > {commit message}` folder
6. Commit generated test files to test repo
7. Log to `syncLogs`

### Dev setup clarification
CLAUDE.md top section now correctly documents: **only PostgreSQL runs in Docker**. Frontend (`npm run dev` in `frontend/`) and backend (`npm run dev` in `backend/`) run locally with hot reload. Docker full-build is only for production or TypeScript verification.

### Projects list duplication bug fix
- `backend/routes/projects/index.js` — replaced the LEFT JOIN + `Op.or` query with a two-step approach: first fetch `memberProjectIds` via `Member.findAll`, then query projects with `{ id: { Op.in: memberProjectIds } }` in the OR. The old JOIN produced duplicate rows when a project matched multiple OR conditions (e.g. public AND member). No `distinct` flag needed — no join, no duplicates.
- `frontend/src/app/[locale]/projects/ProjectsPage.tsx` — fixed `[context]` → `[jwt]` useEffect dep (same pattern as AutomationPage/SettingsPage).

### Members tab now includes project owner
- `backend/routes/members/index.js` — endpoint now fetches the project to get `userId`, fetches the owner user, prepends a synthetic `{ id: null, isOwner: true, User: ownerUser }` entry, and filters out the owner from the regular members array to avoid duplicate if they were also explicitly added.
- `frontend/types/user.ts` — `MemberType.role` is now `number | null`; added `isOwner?: boolean`.
- `frontend/types/member.ts` — added `owner: string` to `MembersMessages`.
- `frontend/messages/en.json` + `he.json` — added `"owner"` key to Members namespace.
- `frontend/.../members/page.tsx` — passes `owner: t('owner')` in messages object.
- `frontend/.../members/MembersTable.tsx` — owner row shows static "Owner" label instead of role dropdown; delete button is always disabled for owner rows (`isDisabled || !!member.isOwner`).
- `frontend/.../members/MembersPage.tsx` — fixed `[context, projectId]` → `[jwt, projectId]` dep.

---

## Recent additions (2026-06-03)

### Dev server: hot reload (local) vs Docker
- Only the PostgreSQL DB runs in Docker. The Next.js frontend and Express backend run locally with hot reload.
- Frontend dev command: `cd frontend && npm run dev` (uses Turbopack: `next dev --turbo -p 8000`)
- Backend dev: runs separately (see backend package.json)
- **Translation key table updated**: only 2 locales now (`en` + `he`). CLAUDE.md previously said 5 locales — that is outdated.

### Automation config cache (frontend)
- Module-level `configCache = new Map<number, AutomationConfigType | null>()` in `frontend/utils/automationConfigControl.ts`.
- `fetchAutomationConfig` checks cache first; stores result (including `null` for 404) on miss.
- `setAutomationConfigCache(projectId, config)` exported for callers to update after mutations.
- Called after save/generate in `AutomationPage.tsx` and after delete-repo/autofix-toggle in `SettingsPage.tsx`.
- Result: zero extra API calls on same-session navigation; only one call per fresh page load.

### useEffect dep fix: `context` → `jwt`
- All `useCallback` hooks and `useEffect` in `AutomationPage.tsx` and `SettingsPage.tsx` previously depended on the entire `context` object. When `projectRoles` updated after login (triggering a new `context` reference), callbacks recreated and the main `useEffect` re-fired — causing 2–3 extra API calls on each page load.
- Fix: extract `const jwt = context.token.access_token` (a stable string) and use `[jwt]` as deps instead of `[context]`. `context` object reference changes when roles load, but `jwt` string stays the same.
- **Convention going forward**: use `jwt = context.token.access_token` as dep, not `context`, in any new `useCallback`/`useEffect` that only needs the token.

### `'use client'` audit — 18 files fixed
Turbopack evaluates module boundaries more strictly than webpack. Files importing `@heroui/react` (which transitively imports `@react-aria/ssr`, which calls `createContext`) without `'use client'` caused a server-side `TypeError: createContext only works in Client Components` crash.

**Architecture principle applied:**
- Static/presentational components → true server components (no HeroUI, no `'use client'`):
  - `LandingPage.tsx` — replaced `<Divider>` with `<hr>`
  - `PaneMainFeatures.tsx` — replaced HeroUI Card/Avatar with Tailwind divs
  - `PaneMainTitle.tsx` — replaced HeroUI Button+ClientLink with `<Link>` + `<a>` (lucide `ExternalLink` icon)
- Interactive components (state, events, HeroUI) → added `'use client'` to 15 files that were missing it:
  - `admin/PasswordResetDialog.tsx`, `admin/UsersTable.tsx`
  - `projects/ProjectsTable.tsx`
  - `folders/FolderEditMenu.tsx`, `folders/FolderItem.tsx`
  - `cases/TestCaseFilter.tsx`, `cases/TestCaseTable.tsx`
  - `cases/[caseId]/CaseAttachmentsEditor.tsx`, `cases/[caseId]/CaseStepsEditor.tsx`
  - `members/CandidatesTable.tsx`, `members/MembersTable.tsx`
  - `runs/RunsTable.tsx`
  - `runs/[runId]/TestCaseSelector.tsx`, `runs/[runId]/TestRunFilter.tsx`
  - `settings/ProjectTagsManager.tsx`

**Rule**: Any component that uses `useState`, `useEffect`, `useContext`, or imports from `@heroui/react` MUST have `'use client'` as the first line.

---

## Recent additions (2026-05-28)

### Automation tab overhaul — credentials moved to Integrations
- Git credentials (token, instance URL, namespace) removed from AutomationConfig; now read at runtime from `IntegrationConfigs` via `backend/routes/automationConfigs/_credentials.js`.
- Automation tab shows creation form (provider, repo name, tool, language) only when no repo is connected (`repoUrl` is null). After connection it shows only: provider chip + repo URL, CI section, error panel.
- `backend/routes/automationConfigs/new.js` and `edit.js` no longer accept credential fields.
- All automation routes (`trigger`, `runStatus`, `repair`, `runErrors`, `fixError`, `generate`) load credentials via `loadProviderCredentials(db, config)`.
- Migration `20260524000004-make-automation-config-token-nullable.js` makes `gitlabToken`/`gitlabUrl` nullable.

### Delete automation project from Settings
- New endpoint: `DELETE /automation-configs/:id/repo` — deletes the remote GitHub or GitLab repo and clears `repoId`/`repoUrl` on the config. Integration credentials are untouched.
- Route: `backend/routes/automationConfigs/deleteRepo.js`. Registered in `server.js`.
- Settings page shows a danger card with the repo URL and Trash button when `automationConfig.repoUrl` is set. Uses `DeleteConfirmDialog` for confirmation.
- New messages: `delete_automation_project`, `delete_automation_project_confirm`, `delete_automation_project_success`, `delete_automation_project_error` in Settings namespace.
- Control function: `deleteAutomationRepo(jwt, id)` in `frontend/utils/automationConfigControl.ts`.

### Backend repository pattern
- New `backend/db/index.js` — initialises Sequelize, loads models, runs `associate()`, returns `{ sequelize, models, Op }`.
- New `backend/repositories/index.js` — maps model aliases to `db.repos.*`.
- All routes now receive a single `db` object; use `db.repos.<model>.findByPk()` etc. instead of raw Sequelize models.

### Locales: English + Hebrew only
- Removed de, ja, zh-CN, pt-BR locale support. Added Hebrew (`he`).
- Changed: `frontend/src/i18n/routing.ts` locales array, `frontend/config/selection.ts` locales list, `frontend/types/locale.ts` `LocaleCodeType`, `backend/config/locale.js` `SUPPORTED_LOCALES`.
- New file: `frontend/messages/he.json` — full Hebrew translation.
- Old locale files (de, ja, zh-CN, pt-BR) remain on disk but are no longer routed to.

---

## Recent additions (2026-05-24)

### Integrations tab
- New sidebar tab. Route: `/projects/:id/integrations`.
- Key files: `frontend/src/app/[locale]/projects/[projectId]/integrations/page.tsx` (server), `IntegrationsPage.tsx` (client).
- Backend: `backend/routes/integrationConfigs/` (show, upsert, destroy). Model: `backend/models/integrationConfigs.js`.
- Migrations: `20260524000001-create-integration-configs.js`, `20260524000003-add-settings-to-integration-configs.js`.
- Services: Anthropic (single `apiKey` field), GitHub and GitLab (multi-field: `token` + `instanceUrl` + `namespace` stored in `settings` JSON column).
- Token masking pattern: DB stores full key; GET returns `***` + last 4 chars; PUT skips update if value starts with `***`.
- ServiceDef pattern in `IntegrationsPage.tsx` — one array for AI providers, one for Git providers. Each def has `id`, `label`, `fields[]`, and `isSettings` flag to split apiKey from settings object.

### AI auto-fix for CI failures
- `backend/routes/automationConfigs/runErrors.js` — parses GitHub Actions job logs. Returns `[{ id, jobId, jobName, testName, filePath, errorText }]`. Strips ANSI codes and log timestamps before regex parsing.
- `backend/routes/automationConfigs/fixError.js` — loads Anthropic key from IntegrationConfigs, fetches file from GitHub contents API, calls `claude-sonnet-4-6`, extracts code block from response, commits fix via PUT to GitHub contents API.
- `frontend/utils/automationConfigControl.ts` — added `RunError` type, `fetchRunErrors`, `fixRunError`, `updateAutoFixEnabled`.
- `AutomationPage.tsx` — collapsible config form (auto-collapses when repo is connected), error panel with per-error "Fix with AI" button, `errorFixState` map tracks idle/fixing/done/error per error id.
- **Catch variable gotcha**: inside `handleFixError(error: RunError)`, name the catch variable `err` not `error` to avoid shadowing the parameter.

### Auto-fix setting
- `autoFixEnabled` boolean on `AutomationConfigs` (migration `20260524000002`).
- Toggle in `SettingsPage.tsx` under "Automation Settings" section — only shown when an automation config exists for the project.
- When ON: `AutomationPage.tsx` `useEffect` on `runErrors` fires all fix calls automatically without user interaction.

### Backend dependency
- `@anthropic-ai/sdk ^0.55.0` added to `backend/package.json`. `backend/package-lock.json` must be kept in sync — run `npm install` in `backend/` after any package.json change, then commit the lock file before Docker rebuild.
