# UnitTCMS - AI Agent Rules

## Project Overview

UnitTCMS is an open-source test case management system built for self-hosted use.

**Repository**: https://github.com/kimatata/unittcms  
**Live Demo**: https://www.unittcms.org  
**Docs**: https://kimatata.github.io/unittcms/docs

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with TypeScript
- **UI Library**: HeroUI (formerly NextUI) + Tailwind CSS
- **i18n**: next-intl (locales: `en`, `de`, `ja`, `pt-BR`, `zh-CN`)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Linting**: ESLint + Prettier

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js 4
- **ORM**: Sequelize 6 with SQLite
- **Auth**: JWT (jsonwebtoken) + bcrypt

### Infrastructure
- **Container**: Docker + docker-compose
- **Default port**: 8000

## Repository Structure

```
unittcms/
├── frontend/              # Next.js app
│   ├── src/
│   │   ├── app/[locale]/  # Localized App Router pages
│   │   ├── i18n/          # next-intl routing & request config
│   │   └── middleware.ts  # next-intl middleware
│   ├── messages/          # Translation JSON files per locale
│   ├── components/        # Shared UI components
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Client-side utility functions
├── backend/
│   ├── routes/            # Express route handlers (one file per operation)
│   ├── models/            # Sequelize model definitions
│   ├── middleware/        # Auth, visibility, editable checks
│   ├── migrations/        # Sequelize DB migrations
│   └── server.js          # Express app entry point
├── e2e/                   # Playwright E2E tests
└── docker-compose.yaml
```

## Development Workflow

### Running Locally (without Docker)

```bash
# Frontend (runs on port 8000)
cd frontend && npm install && npm run dev

# Backend (runs on port 3000)
cd backend && npm install && npm run dev
```

### Running with Docker

```bash
docker-compose up --build
# Access at http://localhost:8000
```

### Testing

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run e2e

# Test coverage
npm run coverage
```

### Formatting & Linting

```bash
npm run format        # Prettier format
npm run format:check  # Check formatting
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
```

## Contributing Guidelines

Per `CONTRIBUTING.md`:
- **PRs go to `develop` branch** (NOT `main`)
- Create a new branch off `develop` for each fix
- `main` is the production snapshot
- Open an issue first for significant changes

## Code Conventions

### Frontend (Next.js)

1. **i18n**
   - All user-facing strings must use `useTranslations` hook or `getTranslations` server function
   - Translation keys live in `messages/{locale}.json`
   - Supported locales: `en`, `de`, `ja`, `pt-BR`, `zh-CN`
   - The middleware matcher **must** cover all paths (including invalid locale prefixes) so next-intl can redirect appropriately
   - Always use the `LocaleCodeType` from `@/types/locale` - valid values: `'de' | 'en' | 'pt-BR' | 'zh-CN' | 'ja'`

2. **Routing**
   - Use `Link`, `redirect`, `useRouter` from `@/src/i18n/routing` (not directly from Next.js or next-intl) to handle locales
   - Pages are under `src/app/[locale]/`

3. **Components**
   - Use HeroUI components
   - Follow existing component structure (props types defined inline or imported from types/)
   - Client components must have `'use client'` directive

4. **State Management**
   - No global state library; context for auth token (`TokenContext`)
   - Local React state for component data

5. **API Calls**
   - All API calls go to `Config.apiServer` (from `@/config/config`)
   - JWT token from `TokenContext` used in `Authorization: Bearer {token}` header
   - After mutating server data, update local state with the server response rather than keeping stale local values

### Backend (Express)

1. **Route structure**: One file per operation (index.js=list, show.js=show, new.js=create, edit.js=update, delete.js=delete)
2. **Auth middleware**: Always apply `verifySignedIn` and appropriate permission middleware to routes
3. **Transactions**: Use Sequelize transactions for multi-step DB operations
4. **Error handling**: Always have try/catch; return `500` with `'Internal Server Error'` on unhandled errors
5. **Input validation**: Validate required parameters and return `400` with descriptive errors

### Steps Model (CaseSteps)

- Junction table: `CaseStep` (caseId + stepId + stepNo)
- `editState` is a frontend-only field: `'new' | 'changed' | 'notChanged' | 'deleted'`
- After successful step save, refresh state with server response to prevent duplicate creates on re-save

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/middleware.ts` | next-intl middleware - must handle ALL path prefixes |
| `frontend/src/i18n/routing.ts` | Locale routing config |
| `frontend/src/i18n/request.ts` | Server-side locale resolution with fallback to `en` |
| `backend/server.js` | Express app setup + route registration |
| `backend/routes/steps/edit.js` | Step create/update/delete via `editState` |
| `backend/routes/cases/edit.js` | Case update (Steps field is stripped before update) |

## Common Bug Patterns

1. **Invalid locale in URL** - middleware matcher must be broad enough to catch paths with unsupported locale prefixes so next-intl can redirect
2. **Step duplication** - after saving steps, update local state from server response; never leave `editState: 'new'` steps in state after a successful save
3. **Stale UI after save** - always reflect server response in local React state after mutations

## Security Notes

- JWT tokens expire and are stored in `TokenContext`
- All mutations require authentication + appropriate role check
- Backend uses rate limiting (1000 req/hour per IP)
- Bcrypt rounds are hardcoded to 10 in `backend/routes/users/signup.js`
