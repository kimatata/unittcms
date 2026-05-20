---
description: Launch and verify the UnitTCMS app. Rebuilds the Docker image, starts the container, and confirms the app is responding on port 8000.
---

# Run UnitTCMS

This project has **no local `node_modules`**. The Next.js frontend is compiled inside Docker during the build stage. Changes to any frontend or backend file require a full image rebuild — there is no hot reload.

## Steps

### 1. Rebuild and start

```powershell
cd "c:\Documents\Projects\unittcms"
docker-compose -f docker-compose.yaml up --build -d
```

This runs a multi-stage Docker build:
- **deps**: installs npm dependencies
- **frontend-builder**: runs `next build` (takes ~1–2 min)
- **runner**: copies build artifacts, installs backend deps, starts `entrypoint.js`

On startup, `entrypoint.js` automatically runs Sequelize migrations before serving.

### 2. Confirm the build succeeded

Look for `✓ Compiled successfully` in the build output. If you see TypeScript or ESLint errors, the build still completes (ESLint has a known options warning that is non-fatal).

### 3. Confirm the container is running

```powershell
docker ps --filter "name=unittcms"
```

Expected: `unittcms-unittcms-1` with status `Up`.

### 4. Confirm the app responds

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/en/projects
```

Expected: `200`

### 5. Check logs if something is wrong

```powershell
docker logs unittcms-unittcms-1 --tail 50
```

## Useful commands

| Action | Command |
|---|---|
| Rebuild + restart | `docker-compose -f docker-compose.yaml up --build -d` |
| Restart without rebuild | `docker-compose -f docker-compose.yaml restart` |
| Stop | `docker-compose -f docker-compose.yaml down` |
| View live logs | `docker logs unittcms-unittcms-1 -f` |
| Shell into container | `docker exec -it unittcms-unittcms-1 sh` |

## URLs

| Page | URL |
|---|---|
| Projects list | http://localhost:8000/en/projects |
| Sign in | http://localhost:8000/en/account/signin |
| Sign up | http://localhost:8000/en/account/signup |
| Admin | http://localhost:8000/en/admin |
| Health check | http://localhost:8000/en/health |
