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
git clone git@github.com:kimatata/unittcms.git
```

## Run backend server

Move to backend directory, then install dependencies.

```bash
cd backend
npm install
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
npm install
```

Build frontend code

```bash
npm run dev
```

Start frontend server

```
PORT=8000 npm run start
```
