# UnitTCMS — Claude Working Guide

Open-source self-hosted test case management system. Full-stack TypeScript monorepo: Next.js 14 frontend + Express/SQLite backend, served together from a single Docker container on port 8000.

---

## Running the project

**The app runs in Docker. There is no local `node_modules` in `frontend/` or `backend/`.**
All code changes require a Docker rebuild — hot reload does not apply.

```powershell
# Rebuild and restart (run from repo root)
docker-compose -f docker-compose.yaml up --build -d
```

App available at: `http://localhost:8000/en/projects`

The frontend Next.js build output and the Express backend are combined in a single process by `entrypoint.js`. On startup, Sequelize migrations run automatically. Set `IS_DEMO=true` in `docker-compose.yaml` to seed sample data.

Key env vars (in `docker-compose.yaml`):
- `PORT=8000`
- `SECRET_KEY=your_secret_key_here`
- `IS_DEMO=false`

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

### Request flow
- All `/api/*` requests → Express backend
- Everything else → Next.js standalone server
- Both served on port 8000 via `entrypoint.js`

### Database
- SQLite at `/app/backend/database/database.sqlite` (persisted via Docker volume)
- Sequelize ORM with numbered migrations in `backend/migrations/`
- Never edit the DB file directly — use migrations

---

## Backend (`backend/`)

**Entry**: `index.js` → `server.js` (Express app setup, route registration)

**Route pattern** — every route file exports a factory function:
```js
export default function(sequelize) {
  router.put('/:id', verifySignedIn, verifyProjectOwner, async (req, res) => { ... });
  return router;
}
```

**Middleware** (`backend/middleware/`):
- `auth.js` — `verifySignedIn` (JWT Bearer), `verifyAdmin`, `verifyProjectOwner`
- `verifyEditable.js` — permission checks for edit operations

**Models** (`backend/models/`): Sequelize model definitions, associations in `models/index.js`.
Key models: `users`, `projects`, `folders`, `cases`, `runs`, `runCases`, `members`, `tags`, `caseTags`, `steps`, `comments`, `attachments`

**Adding a new endpoint:**
1. Create `backend/routes/<resource>/<action>.js`
2. Register it in `backend/server.js`

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
| Add field to existing model | Add migration file in `backend/migrations/`, update model in `backend/models/` |
| Add new API endpoint | Create `backend/routes/<resource>/<verb>.js`, register in `backend/server.js` |
| Add new page | Create `page.tsx` (server) + `FeaturePage.tsx` (client) under `[locale]/...` |
| Add translation key | Edit all 5 `messages/*.json` files + the TypeScript type + `page.tsx` messages object |
| See changes | `docker-compose -f docker-compose.yaml up --build -d` |
| View logs | `docker logs unittcms-unittcms-1 -f` |
| Access container shell | `docker exec -it unittcms-unittcms-1 sh` |
