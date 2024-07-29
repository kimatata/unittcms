---
sidebar_position: 2
---

# Backend

## Environmental variables

:::warning[Strongly Recommended]

Although the system will work with default settings without setting environment variables, it is strongly recommended to set SECRET_KEY in production.

:::

Create `.env` File on `backend/`

```.env
FRONTEND_ORIGIN=http://localhost:8000
PORT=8001
SECRET_KEY=your-secret-key
```

## Set up database

```bash
npm run migrate
```

## Start backend server

```bash
npm run start
```

If you do not bother to place `.env` files, such as in a development environment, you can start the server with `npm run dev`.

## Database operation

The following commands may be useful when trying things out in development:

- drop tables: `npm run drop`
- insert seed data: `npm run seed`
