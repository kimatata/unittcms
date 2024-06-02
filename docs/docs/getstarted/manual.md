---
sidebar_position: 2
---

# Running LandTCMS manually

:::info[Prerequisite]

Prerequisite: v20 or higher node must be installed.

:::

To use LandTCMS, you need run frontend server and backend server (API server).

First, clone the repository.

```bash
git clone git@github.com:kimatata/landtcms.git
```

## Run backend server

Moves to backend directory, then install dependencies.

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
node index
```

## Run frontend server

Moves to frontend directory, then install dependencies.

```bash
cd frontend
npm install
```

Start frontend server

```bash
rpm run dev
```
