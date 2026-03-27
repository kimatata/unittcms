# UnitTCMS - AI Agent Instructions

## Project Overview

UnitTCMS is an open-source test case management system. The frontend uses **Next.js App Router** with **HeroUI v2**, **Tailwind CSS v3**, and the **Electric Spectrum** design system.

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS v3, HeroUI v2
- **Backend**: Node.js with Express, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **i18n**: `next-intl` with `src/app/[locale]/` routing
- **Font**: Manrope (400, 500, 600, 700, 800) via `next/font/google`
- **Testing**: Vitest (unit), Playwright (E2E)

## Project Structure

```
frontend/
├── config/fonts.ts          # Manrope font config
├── styles/globals.css       # Electric Spectrum utility classes
├── tailwind.config.js       # Full design token palette + HeroUI plugin
├── src/app/[locale]/        # All pages (Next.js App Router + next-intl)
│   ├── layout.tsx           # Root layout (bg-[#f5f6ff])
│   ├── HeaderNavbarMenu.tsx # Glass navbar
│   ├── projects/[projectId]/
│   │   ├── Sidebar.tsx      # Dark glassmorphism sidebar
│   │   ├── layout.tsx       # Project layout
│   │   ├── folders/         # Test case folders, cases, editor
│   │   ├── runs/            # Test runs
│   │   └── home/            # Project dashboard
│   ├── admin/               # Admin pages
│   └── account/             # Account & settings
├── components/              # Shared components
├── types/                   # TypeScript types
└── utils/                   # Utility functions
reference/
├── DESIGN.md                # Electric Spectrum design system spec
├── dashboard.html           # Reference HTML mockups
├── projects.html
├── testcase.html
└── testcaselist.html
```

---

## Electric Spectrum Design System

**Reference**: `reference/DESIGN.md`

All UI changes MUST follow the Electric Spectrum design system. This is the single source of truth for all visual decisions.

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#4953ac` | Buttons, links, brand accents |
| Secondary | `#006859` | Teal accents, charts |
| Tertiary | `#652fe7` | Violet accents, gradient endpoints |
| Background | `#f5f6ff` | Page floor |
| On-Surface | `#2b2f37` | Headings, primary text |
| Surface Lowest | `#ffffff` | Cards, elevated content |

### The No-Line Rule

**NEVER** use `1px` solid borders to section UI. Separation is achieved through:
- Tonal background shifts (`bg-slate-50/80`, `bg-indigo-50`)
- Very subtle borders only when structurally necessary: `border-slate-100`
- Spacing (`gap-6`, `my-6`)

**Forbidden patterns**:
- `border-divider` (HeroUI default)
- `border-b-1`, `border-r-1` (explicit 1px)
- `dark:border-neutral-700`, `dark:border-neutral-600`

**Allowed border pattern** (when a line is structurally needed):
```
border-b border-slate-100
border-r border-slate-100
```

### Typography

Font: **Manrope** (configured in `config/fonts.ts`)

| Level | Weight | Class |
|-------|--------|-------|
| Page titles | ExtraBold 800 | `font-extrabold text-4xl text-[#2b2f37] tracking-tight` |
| Section headings | ExtraBold 800 | `font-extrabold text-2xl text-[#2b2f37] tracking-tight` |
| Modal headers | ExtraBold 800 | `font-extrabold text-[#2b2f37]` |
| Labels | SemiBold 600 | `font-semibold text-slate-500` |
| Body text | Medium 500 | `text-slate-600` |
| Muted text | Regular 400 | `text-slate-500` |

**Never** use `font-bold` alone for headings — always use `font-extrabold`.

### Buttons

**Primary (Gradient CTA)**:
```
bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20
```
Use for: Save, Create, Submit, Apply, primary actions.

**Secondary (Flat/Soft)**:
```
bg-indigo-50 text-[#4953ac] font-semibold
```
Use for: New Item, Add, Back, secondary actions.

**Bordered**:
```
border-[#4953ac] text-[#4953ac] font-semibold
```
Use for: outlined/ghost style.

**Danger**: Keep HeroUI `color="danger"` for destructive actions (Delete, Reset).

**NEVER** use bare `color="primary"` on buttons — always apply the gradient or flat class explicitly.

### Cards

```
bg-white rounded-2xl shadow-sm border-none
```

Never use `border-divider` or visible borders on cards.

### Tables (HeroUI Table)

Table wrapper classNames:
```tsx
classNames={{
  wrapper: 'shadow-none rounded-none',
  th: 'bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider',
}}
```

**Forbidden table patterns**:
- `bg-transparent` on `th`
- `text-default-500` on `th`
- `border-b border-divider` on `th`

### Modals

```tsx
<ModalHeader className="flex flex-col gap-1 font-extrabold text-[#2b2f37]">
```

### Layout

- **Page body**: `bg-[#f5f6ff]` (set on root layout)
- **Content containers**: `pt-10 px-8` (not `pt-16 px-6`)
- **Navbar**: `bg-white/70 backdrop-blur-xl border-b border-indigo-100/50 shadow-sm`
- **Sidebar**: `bg-indigo-950` with active item `bg-gradient-to-r from-indigo-600 to-violet-500`

### Dropzone / File Upload Areas

```
border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-indigo-50/50
```

Not `bg-neutral-50`, not `border-neutral-200`.

### Text Color Replacements

| Old (Forbidden) | New (Required) |
|-----------------|----------------|
| `text-default-500` | `text-slate-500` |
| `text-default-400` | `text-slate-400` |
| `text-neutral-500` | `text-slate-500` |
| `bg-neutral-50` | `bg-slate-50` or `bg-indigo-50` |
| `bg-neutral-50 dark:bg-neutral-600` | `bg-indigo-50 text-[#4953ac]` (for buttons) |

### Dividers

Replace HeroUI `<Divider />` with:
```tsx
<div className="my-6 border-t border-slate-100" />
```

Remove `Divider` from imports when no longer used.

### Tree/Panel Containers

```
border border-slate-100 rounded-2xl
```

Not `border-2 dark:border-neutral-700 rounded-small`.

### Chips & Tags

Use `secondary-container` backgrounds with `on-secondary-container` text for analytical chips.

---

## CSS Utility Classes

Defined in `frontend/styles/globals.css`:

| Class | Purpose |
|-------|---------|
| `.glass-panel` | `backdrop-filter: blur(20px)` for glassmorphism |
| `.spectrum-border-left` | 4px gradient left-border (teal → violet) |
| `.glowing-progress` | Teal glow box-shadow for progress bars |
| `.bg-electric-gradient` | 135° gradient from `#4953ac` to `#652fe7` |
| `.btn-gradient-primary` | Primary → Primary Container gradient fill |

---

## Development Commands

```powershell
# Frontend
cd frontend
npm install
npm run dev          # Dev server
npx next build       # Production build

# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Tests
npx vitest run       # Unit tests
npx playwright test  # E2E tests
```

---

## Rules for AI Agents

### Before Making Changes

1. Read `reference/DESIGN.md` for the full design system specification
2. Check `reference/*.html` for visual reference mockups
3. Review this file for implemented patterns and class conventions
4. Look at existing components for established patterns

### When Editing Components

1. **Never** introduce `border-divider`, `text-default-500`, `bg-neutral-50`, `dark:border-neutral-*`, or bare `color="primary"` on buttons
2. **Always** use the exact Tailwind classes documented above — don't approximate
3. **Preserve all functionality** — routing, data fetching, i18n, event handlers must remain intact
4. **Remove unused imports** when replacing components (e.g., `Divider` → `div`)
5. **Don't add dark mode classes** — Electric Spectrum is a light-first design system; dark mode uses HeroUI theme tokens configured in `tailwind.config.js`

### After Making Changes

1. Run `get_errors` or `npx next build` to verify no compilation errors
2. Ensure no HeroUI default styles leak through (check for `default-500`, `border-divider`, etc.)
3. Verify consistent patterns across similar components (all tables, all modals, all buttons)

### Pattern Quick Reference

```tsx
// ✅ Correct: Gradient primary button
<Button className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20">
  Save
</Button>

// ❌ Wrong: Bare color="primary"
<Button color="primary">Save</Button>

// ✅ Correct: Soft secondary button
<Button className="bg-indigo-50 text-[#4953ac] font-semibold">
  Add New
</Button>

// ❌ Wrong: Old neutral style
<Button variant="bordered">Add New</Button>

// ✅ Correct: Page heading
<h1 className="font-extrabold text-4xl text-[#2b2f37] tracking-tight">Projects</h1>

// ❌ Wrong: Default heading
<h1 className="font-bold text-2xl">Projects</h1>

// ✅ Correct: Table classNames
classNames={{
  wrapper: 'shadow-none rounded-none',
  th: 'bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider',
}}

// ❌ Wrong: HeroUI defaults
classNames={{
  th: 'bg-transparent text-default-500 border-b border-divider',
}}

// ✅ Correct: Modal header
<ModalHeader className="flex flex-col gap-1 font-extrabold text-[#2b2f37]">

// ✅ Correct: Subtle divider
<div className="my-6 border-t border-slate-100" />

// ❌ Wrong: HeroUI Divider
<Divider className="my-6" />
```
