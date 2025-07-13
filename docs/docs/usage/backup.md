---
sidebar_position: 2
---

# Backup

## Database backup

UnitTCMS uses SQLite for data persistence. Therefore, backing up the database is simply backing up the SQLite DB file.

Please back up the file `backend/database/database.sqlite`.

## Backup of uploaded files

Uploaded files are managed separately from the database. If you have uploaded files, you need to back them up too.

Please back up the files under the `backend/public/uploads` directory.

## Backup in Docker environment

When running UnitTCMS with Docker, the SQLite database file and uploaded files are stored as follows (as specified in `docker-compose.yaml`):

- **Database file**: Stored in a Docker named volume (`db-data`).
- **Uploaded files**: Stored in the host directory `./backend/public/uploads`, which is mounted into the container.

### Backup steps

To back up the database file stored in the Docker volume (`db-data`), run:

```sh
docker run --rm -v db-data:/data -v $(pwd):/backup busybox cp /data/database.sqlite /backup/database.sqlite
```

To back up uploaded files, simply copy the files from `./backend/public/uploads` on your host:

```sh
cp -r ./backend/public/uploads ./backup/uploads
```

This will copy the database file and uploaded files to your backup directory.

To restore, copy the files back into the volume and the uploads directory as needed.
