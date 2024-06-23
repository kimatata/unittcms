# unittcms Backend

## Install dependencies

```bash
npm install
```

## Set Environmental variable

Create `.env` File

```
FRONTEND_ORIGIN=http://localhost:8000
PORT=8001
SECRET_KEY=your-secret-key
```

## Set up database

```bash
npm run migrate
```

## Run the development server

```bash
node --env-file=.env index.js
```

## Database operation command

### drop table

```bash
npm run drop
```

### add seed data

```bash
npm run seed
```
