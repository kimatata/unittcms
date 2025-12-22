#!/bin/bash

set -e

CURRENT_BRANCH=$(git branch --show-current)
UPSTREAM_BRANCH="main"
ORIGIN_BRANCH="main"

echo "Syncing with upstream..."

if [ "$CURRENT_BRANCH" != "$UPSTREAM_BRANCH" ]; then
    echo "Warning: You are on branch '$CURRENT_BRANCH'. Switching to '$UPSTREAM_BRANCH'..."
    git checkout $UPSTREAM_BRANCH
fi

echo "Fetching updates from upstream..."
git fetch upstream

echo "Checking differences..."
BEHIND=$(git rev-list --count HEAD..upstream/$UPSTREAM_BRANCH 2>/dev/null || echo "0")
AHEAD=$(git rev-list --count upstream/$UPSTREAM_BRANCH..HEAD 2>/dev/null || echo "0")

if [ "$BEHIND" = "0" ]; then
    echo "Your branch is up to date, no new updates from upstream"
    exit 0
fi

echo "Found $BEHIND new commits from upstream"
echo "You have $AHEAD commits that are not in upstream"

read -p "Continue synchronization? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Synchronization cancelled"
    exit 1
fi

echo "Merging with upstream/$UPSTREAM_BRANCH..."
if git merge upstream/$UPSTREAM_BRANCH; then
    echo "Merge successful"
    
    read -p "Push changes to origin? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing changes to origin..."
        git push origin $ORIGIN_BRANCH
        echo "Synchronization complete"
    else
        echo "Changes left locally. Run 'git push origin $ORIGIN_BRANCH' when ready"
    fi
else
    echo "Conflicts occurred during merge"
    echo "Resolve conflicts and run:"
    echo "  git add <resolved-files>"
    echo "  git commit"
    exit 1
fi
