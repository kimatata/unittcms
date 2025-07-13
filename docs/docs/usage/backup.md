---
sidebar_position: 2
---

# Backup

## Database backup

UnitTCMS uses SQLite for data persistence. Therefore, backing up the database is simply backing up the SQLite DB file.

Please back up the file `backend/database/database.sqlite`.

:::note[In Docker environment]

In a docker environment, DB file is stored in a Docker named volume (`db-data`).

:::

## Backup of uploaded files

Uploaded files are managed separately from the database. If you have uploaded files, you need to back them up too.

Please back up the files under the `backend/public/uploads` directory.
