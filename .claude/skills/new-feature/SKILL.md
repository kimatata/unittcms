---
name: new-feature
description: Step-by-step guide for adding a new feature (page, API endpoint, translation keys, table action) to UnitTCMS following established project conventions.
---

# Adding a New Feature to UnitTCMS

## Checklist

### 1. Backend — API endpoint (if needed)

Check `backend/server.js` first — the endpoint may already exist.

**Create route file** `backend/routes/<resource>/<verb>.js`:
```js
import express from 'express';
import { verifySignedIn, verifyProjectOwner } from '../../middleware/auth.js';

export default function (sequelize) {
  const router = express.Router();
  const { Model } = sequelize.models;

  router.put('/:id', verifySignedIn, verifyProjectOwner, async (req, res) => {
    try {
      const { id } = req.params;
      const { field } = req.body;
      await Model.update({ field }, { where: { id } });
      const updated = await Model.findByPk(id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
```

**Register in `backend/server.js`**:
```js
import newRoute from './routes/<resource>/<verb>.js';
// ...
app.use('/<resource>', newRoute(sequelize));
```

> `entrypoint.js` proxies all `/api/*` traffic to Express — do NOT add `/api` here or the route becomes `/api/api/<resource>`.

**Auth middleware options:**
- `verifySignedIn` — any logged-in user
- `verifyAdmin` — global admin only
- `verifyProjectOwner` — project owner only

---

### 2. Frontend — API control function

Control files live in `frontend/utils/<resource>Control.ts`.
**Exception**: runs control is co-located at `frontend/src/app/[locale]/projects/[projectId]/runs/runsControl.ts` — not in `utils/`.

```ts
import Config from '@/config/config';
import { logError } from '@/utils/errorHandler';

// Config.apiServer already resolves to "/api" — do NOT add "/api" again
async function updateThing(jwt: string, thingId: number, name: string) {
  try {
    const response = await fetch(`${Config.apiServer}/<resource>/${thingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
  } catch (error: unknown) {
    logError('Error updating thing:', error);
    throw error;
  }
}
export { updateThing };
```

---

### 3. TypeScript types

**Add message type** in `frontend/types/<resource>.ts`:
```ts
export type ThingMessages = {
  thingList: string;
  newThing: string;
  editThing: string;
  // ...
};
```

---

### 4. Translation keys — ALL 5 locale files

Add to `frontend/messages/en.json`, `de.json`, `ja.json`, `zh-CN.json`, `pt-BR.json`:
```json
"ThingSection": {
  "thing_list": "Thing List",
  "new_thing": "New Thing",
  "edit_thing": "Edit Thing"
}
```

Never add a key to only one locale file. All 5 must stay in sync.

---

### 5. Server component `page.tsx`

```tsx
import { useTranslations } from 'next-intl';
import ThingPage from './ThingPage';
import { ThingMessages } from '@/types/thing';

export default function Page({ params }: { params: { projectId: string; locale: string } }) {
  const t = useTranslations('ThingSection');
  const messages: ThingMessages = {
    thingList: t('thing_list'),
    newThing: t('new_thing'),
    editThing: t('edit_thing'),
  };

  return <ThingPage projectId={params.projectId} messages={messages} />;
}
```

---

### 6. Client page component `ThingPage.tsx`

```tsx
'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { ThingMessages } from '@/types/thing';

export default function ThingPage({ projectId, messages }: { projectId: string; messages: ThingMessages }) {
  const context = useContext(TokenContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!context.isSignedIn()) return;
    // fetch data...
  }, [context, projectId]);

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.thingList}</h3>
        <Button
          size="sm"
          color="primary"
          startContent={<Plus size={16} />}
          isDisabled={!context.isProjectReporter(Number(projectId))}
        >
          {messages.newThing}
        </Button>
      </div>
      {/* Table component here */}
    </div>
  );
}
```

---

### 7. Adding an action to an existing table

Canonical pattern (see `RunsTable.tsx`):

```tsx
// In headerColumns:
{ name: messages.actions, uid: 'actions', sortable: false }

// In renderCell switch:
case 'actions':
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly radius="full" size="sm" variant="light">
          <MoreVertical size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="actions" disabledKeys={isDisabled ? ['edit'] : []}>
        <DropdownItem key="edit" onPress={() => onEdit(item)}>
          {messages.editThing}
        </DropdownItem>
        <DropdownItem key="delete" className="text-danger" onPress={() => onDelete(item.id)}>
          {messages.deleteThing}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
```

---

### 8. Adding a create/edit dialog

Canonical pattern (see `ProjectDialog.tsx`):
- Single dialog for both create and edit
- `editingItem: T | null` prop — null = create, populated = edit
- `useEffect` to reset form when `editingItem` changes
- Button label: `editingItem ? messages.update : messages.create`

---

### 9. Delete confirmation dialog

Always use the shared component — never an inline confirm:
```tsx
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

// State in FeaturePage.tsx:
const [deletingId, setDeletingId] = useState<number | null>(null);

const handleDelete = async () => {
  if (!deletingId) return;
  await deleteThing(context.token.access_token, deletingId);
  setItems(items.filter((i) => i.id !== deletingId));
  setDeletingId(null);
};

// In JSX:
<DeleteConfirmDialog
  isOpen={deletingId !== null}
  onCancel={() => setDeletingId(null)}
  onConfirm={handleDelete}
  closeText={messages.close}
  confirmText={messages.areYouSure}
  deleteText={messages.delete}
/>
```

In the table, call `onDelete(item.id)` from the dropdown → parent sets `deletingId`.

---

### 10. Success/error toasts

Import `addToast` from `@heroui/react` and call after mutations:
```ts
import { addToast } from '@heroui/react';

// success
addToast({ title: 'Success', description: messages.saved, color: 'success' });
// error
addToast({ title: 'Error', description: messages.failed, color: 'danger' });
```

---

### 11. After creating a new project

Call `context.refreshProjectRoles()` immediately after the create API call succeeds. Without it, `isProjectOwner` etc. return false for the new project until the next page load (roles are fetched once on mount).

---

### 12. Rebuild Docker

```powershell
cd "c:\Documents\Projects\unittcms"
docker-compose -f docker-compose.yaml up --build -d
```

Build output must show `✓ Compiled successfully`. The container recreates automatically.
