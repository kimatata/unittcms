---
sidebar_position: 3
---

# Running TestPlat manually

:::info[Prerequisite]

Prerequisite: v20 or higher node must be installed.

:::

To use TestPlat, you need run frontend server and backend server (API server).

First, clone the repository.

```bash
git clone git@github.com:kimatata/TestPlat.git
```

## Run backend server

Moves to backend directory, then install dependencies.

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
node index
```

## Run frontend server

Moves to frontend directory, then install dependencies.

```bash
cd frontend
npm ci
```

Start frontend server

```bash
rpm run dev
```
