---
sidebar_position: 3
---

# Running UnitTCMS manually

:::info[Prerequisite]

Prerequisite: v20 or higher node must be installed.

:::

To use UnitTCMS, you need run frontend server and backend(API) server.

First, clone the repository.

```bash
git clone https://github.com/kimatata/unittcms.git
```

## Run backend server

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

```bash
cd frontend
npm ci
```

Build frontend code

```bash
npm run build
```

Start frontend server

```
npm run start
```
