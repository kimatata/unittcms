# Fork Workflow

This document describes best practices for working with a forked project to maintain your own changes while keeping up with updates from the original repository.

## Remote Configuration

The project has two remotes:
- `origin` - your fork (BostonLeeK/unittcms)
- `upstream` - original repository (kimatata/unittcms)

Check remotes:
```bash
git remote -v
```

If upstream is missing, add it:
```bash
git remote add upstream https://github.com/kimatata/unittcms.git
```

## Branch Strategy

### Recommended Branch Structure

1. **main** - your main branch with your changes
2. **upstream-main** - local copy of original main branch (optional)
3. **feature/*** - branches for new features
4. **fix/*** - branches for fixes

### Creating Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

## Syncing Updates from Upstream

### Method 1: Merge (recommended for beginners)

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### Method 2: Rebase (for clean history)

```bash
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

Warning: `--force-with-lease` is safer than `--force`, but still overwrites history. Use only if you are certain.

### Method 3: Separate Sync Branch

```bash
git fetch upstream
git checkout -b sync-upstream
git merge upstream/main
git checkout main
git merge sync-upstream
git branch -d sync-upstream
git push origin main
```

## Resolving Conflicts

If conflicts occur during merge/rebase:

1. Check conflicted files:
```bash
git status
```

2. Open files and resolve conflicts manually

3. After resolution:
```bash
git add <resolved-files>
git commit  # for merge
# or
git rebase --continue  # for rebase
```

## Daily Workflow

### 1. Start of Work Day

```bash
git checkout main
git fetch upstream
git fetch origin
```

Check for updates:
```bash
git log HEAD..upstream/main --oneline
```

### 2. Pull Updates (if available)

```bash
git merge upstream/main
```

### 3. Create Branch for New Work

```bash
git checkout -b feature/new-feature
```

### 4. After Completing Work

```bash
git add .
git commit -m "Description of changes"
git push origin feature/new-feature
```

### 5. Merge to Main (after review)

```bash
git checkout main
git merge feature/new-feature
git push origin main
```

## Syncing Feature Branch with Upstream

If working on a feature branch for an extended period:

```bash
git checkout feature/my-feature
git fetch upstream
git merge upstream/main
# or
git rebase upstream/main
```

## Status Check

Check how far behind your fork is from upstream:
```bash
git fetch upstream
git log HEAD..upstream/main --oneline
```

Check what you have that upstream doesn't:
```bash
git log upstream/main..HEAD --oneline
```

## Creating Pull Request to Original Repository

If you want to contribute changes to the original project:

1. Create branch with your changes
2. Push to your fork
3. Create PR on GitHub from your fork to kimatata/unittcms

## Automation

Use the provided `sync-upstream.sh` script for quick synchronization:

```bash
./sync-upstream.sh
```

## Important Guidelines

1. Never commit directly to main - use feature branches
2. Sync regularly - more often is better than less often
3. Test after synchronization - ensure everything works
4. Keep backups - create branch backup before rebase
5. Use tags - mark important versions before synchronization

## Backup Before Synchronization

```bash
git tag backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## Reverting Changes (if something goes wrong)

```bash
git reflog  # find commit before the problem
git reset --hard <commit-hash>
```

Or revert to tag:
```bash
git reset --hard backup-20250121
```
