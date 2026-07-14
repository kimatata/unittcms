---
sidebar_position: 4
---

# Override settings

UnitTCMS will work with the default settings, but you can override them as needed.

:::warning[Strongly Recommended]

It is strongly recommended to change `SECRET_KEY` from the default value in production.

:::

## Database backend

By default UnitTCMS uses SQLite, configured via `DATABASE_PATH`. To use PostgreSQL instead, set `DB_DIALECT=postgres` plus connection info, via either discrete fields (recommended) or a single URL:

```
DB_DIALECT=postgres
DB_HOST=host
DB_PORT=5432
DB_NAME=database
DB_USER=user
DB_PASSWORD=password
```

```
DB_DIALECT=postgres
DATABASE_URL=postgres://user:password@host:5432/database
```

Prefer the discrete `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` fields when the password contains special characters (`%`, `#`, `@`, `/`, etc.) — those characters are structurally ambiguous once embedded in a URL and require percent-encoding to parse correctly; the discrete fields are passed straight through to the database driver with no URL parsing involved. `DATABASE_URL` is only used when `DB_HOST` is unset.

Both are ignored when `DB_DIALECT` is unset or `sqlite`, and `DATABASE_PATH` is ignored when `DB_DIALECT=postgres`.

## Docker

If you are self-hosting UnitTCMS with Docker, you can customize the environment using the `environment` section in `docker-compose.yaml`.

```yaml title="docker-compose.yaml"
services:
  unittcms:
    image: unittcms:latest
    build: .
    ports:
      - '8000:8000'
    // highlight-start
    environment:
      - PORT=8000
      - SECRET_KEY=your_secret_key_here
      - IS_DEMO=false # set to true to seed the database
      - API_PATH=/api
      - DATABASE_PATH=/app/backend/database/database.sqlite
      # - DB_DIALECT=postgres
      # - DATABASE_URL=postgres://user:password@host:5432/database
    // highlight-end
    volumes:
      - db-data:/app/backend/database

volumes:
  db-data:
```

## From Source

If you are self-hosting UnitTCMS from source, you can override the environment by placing `.env` files in the appropriate directory.

### Setting frontend environment variables

Create a `.env` file in the `frontend/` directory:

```.env title="frontend/.env"
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8001
```

### Setting backend environment variables

Create a `.env` file in the `backend/` directory:

```.env title="backend/.env"
FRONTEND_ORIGIN=http://localhost:8000
PORT=8001
SECRET_KEY=your-secret-key
```
