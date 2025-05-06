---
sidebar_position: 5
---

# Override settings

The system will work with default settings without setting environment variables, but you can override the settings by placing `.env` file.

## setting frontend environment variables

Create `.env` File on `frontend/`

```.env title="frontend/.env"
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8001
```

## setting backend environment variables

Create `.env` File on `backend/`

:::warning[Strongly Recommended]

It is strongly recommended to set SECRET_KEY in production.

:::

```.env title="backend/.env"
FRONTEND_ORIGIN=http://localhost:8000
PORT=8001
SECRET_KEY=your-secret-key
```
