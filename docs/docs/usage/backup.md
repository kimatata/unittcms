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
