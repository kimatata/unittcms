# UnitTCMS — Claude Working Guide

Open-source self-hosted test case management system. Full-stack TypeScript monorepo: Next.js 14 frontend + Express/PostgreSQL backend, served together from a single Docker container on port 8000.

---

## Running the project

**The app runs in Docker. There is no local `node_modules` in `frontend/` or `backend/`.**
All code changes require a Docker rebuild — hot reload does not apply.

```powershell
# Rebuild and restart (run from repo root)
docker-compose -f docker-compose.yaml up --build -d
```

App available at: `http://localhost:8000/en/projects`

> **Docker cache not picking up changes?** On Windows, Docker sometimes serves a fully cached build even after file edits. Force a clean rebuild:
> ```powershell
> docker-compose -f docker-compose.yaml build --no-cache && docker-compose -f docker-compose.yaml up -d
> ```

The frontend Next.js build output and the Express backend are combined in a single process by `entrypoint.js`. On startup, Sequelize migrations run automatically. Set `IS_DEMO=true` in `docker-compose.yaml` to seed sample data.

Key env vars (in `docker-compose.yaml`):
- `PORT=8000`
- `SECRET_KEY=your_secret_key_here`
- `IS_DEMO=false`
- `DATABASE_URL=postgresql://unittcms:unittcms_secret@postgres:5432/unittcms` (set automatically by compose)

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
| Add translation key | Edit all 5 `messages/*.json` files + the TypeScript type + `page.tsx` messages object |
| See changes | `docker-compose -f docker-compose.yaml up --build -d` |
| Force clean rebuild (cache miss) | `docker-compose -f docker-compose.yaml build --no-cache && docker-compose -f docker-compose.yaml up -d` |
| View logs | `docker logs unittcms-unittcms-1 -f` |
| Access container shell | `docker exec -it unittcms-unittcms-1 sh` |

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
