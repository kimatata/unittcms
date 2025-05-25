---
sidebar_position: 3
---

# Running UnitTCMS from Source

While using Docker is the recommended and easiest way to run UnitTCMS, this chapter explains how to run it directly from source. This approach is useful for those who cannot use Docker or are interested in contributing to UnitTCMS development. Since the frontend and backend are completely decoupled, this setup also supports more advanced use cases — such as serving the frontend via AWS S3 + CloudFront, or replacing the default SQLite database with another backend solution.

:::info[Prerequisite]

Prerequisite: v20 or higher node must be installed.

:::

To use UnitTCMS, you need to run both frontend server and backend(API) server.

First, clone the repository.

```bash
git clone https://github.com/kimatata/unittcms.git
```

## Run backend server

Place the .env file at `backend/.env`.

```.env title="backend/.env"
FRONTEND_ORIGIN=http://localhost:8000
```

Move to backend directory, then install dependencies.

```bash
cd backend
npm ci
```

Initialize the database with the following command.

```bash
npm run migrate
```

Start backend server.

```bash
npm run start
```

## Run frontend server

Move to frontend directory, then install dependencies.

Place the .env file at `frontend/.env`.

```.env title="frontend/.env"
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8001
```

```bash
cd frontend
npm ci
```

Build frontend code

```bash
npm run build
```

Start frontend server

```bash
npm run start
```
