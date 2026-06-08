# Close Session

Triggered when the user says "close session". Performs all end-of-session housekeeping in order.

## Steps

### 1. Update CLAUDE.md

Add a new "Recent additions (YYYY-MM-DD)" section at the top of the existing recent-additions block. Cover:
- Every new or changed **backend route** (method, path, what it does)
- Every new or changed **frontend component or page**
- Every new **locale key** added to en.json / he.json
- Every **type change** in `frontend/types/`
- Every **bug fixed** with a one-line root-cause explanation
- Any new **architecture pattern** introduced

Do NOT duplicate entries already present in CLAUDE.md.

### 2. Update memory files

Update `C:\Users\shira\.claude\projects\c--Documents-Projects-unittcms\memory\project_unittcms.md` with the same information in condensed form.

If a new pattern was established that affects future behavior (a correction, a validated approach, a new convention), also create or update the relevant `feedback_*.md` memory file and add a pointer to `MEMORY.md`.

### 3. Commit only Claude's changes

Identify which files Claude modified during this session (based on the work done — do NOT include files the user edited independently).

Stage only those files explicitly by name. Never use `git add .` or `git add -A`.

Use a commit message in this format:
```
claude: <short summary of session work>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

If there were multiple distinct areas of work, list them as bullet points in the commit body.

### 4. Push

Push to the current branch:
```powershell
git push
```

Confirm the push succeeded by checking the output for the remote branch reference.

---

## What NOT to do
- Do not stage or commit files the user modified independently
- Do not amend previous commits
- Do not push to main/master directly
- Do not skip the docs update (steps 1–2) before committing
