---
sidebar_position: 3
---

# Frontend

## Environmental variables

:::info

Although the system will work with default settings without setting environment variables, but you can override the settings by setting environment variables.

:::

Create `.env` File on `frontend/`

```
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8001
```

## Start frontend server with dev mode

```bash
npm run dev
```

## Start frontend server with production mode

```bash
npm run build
npm run start
```
