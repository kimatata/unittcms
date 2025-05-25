---
sidebar_position: 4
---

# Override settings

UnitTCMS will work with the default settings, but you can override them as needed.

:::warning[Strongly Recommended]

It is strongly recommended to change `SECRET_KEY` from the default value in production.

:::

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
