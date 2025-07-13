---
sidebar_position: 2
---

# Backup

## Database backup

UnitTCMS uses SQLite for data persistence. Therefore, backing up the DB is simply backing up the SQLite DB file.

Please backup the file `backend/database/database.sqlite`

## Backup of uploaded files

Uploaded files are managed separately from the DB. If you have uploaded files, you need to backup them too.

Please backup the files under `backend/public/uploads` directory.

## Backup in Docker environment

When running UnitTCMS with Docker, the SQLite database file and uploaded files are stored as follows:

- **Database file**: Stored in a Docker named volume (`db-data`).
- **Uploaded files**: Stored in the host directory `./backend/public/uploads` (mounted into the container).

### Backup steps

To backup the database volume, use:

```sh
# Backup the database volume
docker run --rm -v unittcms_db_data:/data -v $(pwd):/backup busybox cp /data/database.sqlite /backup/database.sqlite
```

> Note: In your docker-compose.yaml, the volume name is `db-data`, so use that name:
>
> ```sh
> docker run --rm -v unittcms_db_data:/data -v $(pwd):/backup busybox cp /data/database.sqlite /backup/database.sqlite
> ```

To backup uploaded files, simply copy the files from `./backend/public/uploads` on your host:

```sh
cp -r ./backend/public/uploads ./backup/uploads
```

This will copy the database file and uploaded files to your backup directory.

For restoring, you can copy files back into the volume and the uploads directory as needed.
