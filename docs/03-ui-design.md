# UI Design

## Design Principles

- **Dark-first** theme with a moody, atmospheric feel suited for roleplay content.
- **Minimal chrome** — let the character images dominate.
- **Responsive** — works on desktop (primary) and tablet; mobile is secondary.
- **Consistent spacing** — 8px grid system.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#0a0a0f` | Page background |
| `bg-surface` | `#15151e` | Cards, panels |
| `bg-surface-elevated` | `#1e1e2d` | Hover states, elevated panels |
| `border` | `#2a2a3a` | Subtle borders |
| `text-primary` | `#e4e4ef` | Primary text |
| `text-secondary` | `#8888a0` | Secondary/muted text |
| `accent` | `#7c3aed` | Primary accent (purple) |
| `accent-hover` | `#6d28d9` | Accent hover |
| `danger` | `#ef4444` | Delete, destructive actions |

## Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Page title | Inter (or system sans) | 24px | 700 |
| Character name | Inter | 20px | 600 |
| Body text | Inter | 14px | 400 |
| Label badge | Inter | 12px | 500 |
| Caption | Inter | 11px | 400 |

## Layout Grid

- Desktop: max-width `1440px`, centered.
- Main gallery grid: responsive columns, `minmax(260px, 1fr)`.
- Card aspect ratio: **3:4** (portrait, typical for character art).

---

## Screen 1 — Main Gallery

### URL: `/`

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🎭 Character Gallery              [+ New Character] [🎲 Random] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ CONTROLS BAR                                                        │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Pic set: [◉ Face] [○ Body]     Labels: [All ▼] [Fantasy] [Sci-fi] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ CHARACTER GRID                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │          │ │          │ │          │ │          │               │
│ │  [face   │ │  [face   │ │  [body   │ │  [face   │               │
│ │   pic]   │ │   pic]   │ │   pic]   │ │   pic]   │               │
│ │          │ │          │ │          │ │          │               │
│ │──────────│ │──────────│ │──────────│ │──────────│               │
│ │  Name    │ │  Name    │ │  Name    │ │  Name    │               │
│ │  [label] │ │  [label] │ │  [label] │ │  [label] │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ (empty state: "No characters yet. Create your first character!")    │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Description |
|---|---|
| **Header** | App title on the left. Actions on the right. |
| **[+ New Character]** | Navigates to `/new`. |
| **[🎲 Random]** | Picks a random character from the currently filtered set and navigates to `/character/[id]`. |
| **Pic set toggle** | `Face` / `Body` radio toggle. Controls which image set the random card pic comes from. Default: **Face**. |
| **Labels filter** | Multi-select dropdown or pill toggle. Shows all labels. When labels are selected, only characters with at least one matching label are shown. "All" shows everything. |
| **Exclude labels** | Multi-select dropdown. Characters with any selected label are hidden from the results. "None" excludes nothing. |
| **Character card** | Displays one random image from the selected set (face or body). Shows character name below. Labels shown as small colored badges. Clicking the card navigates to the character detail screen. |
| **Empty state** | Shown when no characters exist or no characters match the filter. |

### Card Behavior

- Each card shows **one random pic** from the chosen set (face or body).
- The random pic is selected on page load. It does not auto-rotate on this screen (rotation is only on the character detail screen).
- If a character has no images in the selected set, show a placeholder with a silhouette icon.

---

## Screen 2 — Create Character

### URL: `/new`

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Gallery                                                   │
│                                                                     │
│           Create New Character                                      │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────────┐ │
│   │  Name:  [________________________]                           │ │
│   │                                                               │ │
│   │  Bio / Description:                                           │ │
│   │  [____________________________________________________________] │ │
│   │  [____________________________________________________________] │ │
│   │  [____________________________________________________________] │ │
│   │                                                               │ │
│   │  Labels:  [+ Add Label]  [Fantasy ✕] [Sci-Fi ✕]             │ │
│   │            (dropdown of existing labels + "Create new...")   │ │
│   │                                                               │ │
│   │                        [Cancel]  [Create Character]           │ │
│   └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Description |
|---|---|
| **Name** | Required text input. |
| **Bio** | Multi-line textarea. Optional at creation time. |
| **Labels** | Multi-select combobox. Can pick existing labels or type to create a new one. Removing a label removes the badge (doesn't delete the label from the system). |
| **Cancel** | Navigates back to `/`. |
| **Create Character** | Validates name is non-empty. Creates the character, then navigates to `/character/[id]`. |

---

## Screen 3 — Character Detail

### URL: `/character/[id]`

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Gallery                              [🗑 Delete Character]│
│                                                                     │
│                    CHARACTER NAME                                    │
│                                                                     │
│ ┌──────────────┐ ┌────────────────────────┐ ┌──────────────┐       │
│ │              │ │                        │ │              │       │
│ │              │ │  Bio / Description     │ │              │       │
│ │   [random    │ │                        │ │   [random    │       │
│ │    face      │ │  Lorem ipsum dolor     │ │    body      │       │
│ │    pic]       │ │  sit amet...           │ │    pic]       │       │
│ │              │ │                        │ │              │       │
│ │              │ │  [Label1] [Label2]     │ │              │       │
│ │              │ │                        │ │              │       │
│ │              │ │                        │ │              │       │
│ └──────────────┘ │  [✏ Edit Bio]          │ └──────────────┘       │
│                  │  [🏷 Edit Labels]       │                        │
│ [🖼 Face Gallery]│                        │[🖼 Body Gallery]       │
│                  └────────────────────────┘                        │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🔄 Auto-rotate: [◉ On]  Delay: [5s ▼]                         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Description |
|---|---|
| **Back** | Navigates to `/`. |
| **[🗑 Delete Character]** | Opens a confirmation dialog. If confirmed, deletes the character and all associated data (images removed from disk), then navigates to `/`. |
| **Random face pic** | Shows a random face image. Auto-rotates every N seconds (configurable). If no face images, show placeholder. |
| **Random body pic** | Shows a random body image. Auto-rotates every N seconds (configurable). If no body images, show placeholder. |
| **[🖼 Face Gallery]** | Navigates to `/character/[id]/face`. |
| **[🖼 Body Gallery]** | Navigates to `/character/[id]/body`. |
| **[✏ Edit Bio]** | Opens an inline editor or modal with a textarea pre-filled with the current bio. Save updates the character. |
| **[🏷 Edit Labels]** | Opens a label editor modal (same multi-select combobox as character creation). |
| **Auto-rotate toggle** | Toggle to enable/disable automatic pic cycling. Default: **On**. |
| **Delay selector** | Dropdown or number input for rotation delay in seconds. Options: 3s, 5s (default), 10s, 15s, 30s, 60s. |

### Delete Confirmation Dialog

```
┌─────────────────────────────────────────┐
│  ⚠ Delete Character                     │
│                                         │
│  Are you sure you want to delete        │
│  "Character Name"? This will remove     │
│  all images and data. This action        │
│  cannot be undone.                       │
│                                         │
│            [Cancel]  [Delete]           │
└─────────────────────────────────────────┘
```

- The **Delete** button is colored red (`danger`).
- The confirmation requires a click (no typing confirm).

---

## Screen 4 — Face Gallery

### URL: `/character/[id]/face`

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Character                                                  │
│                                                                     │
│   Character Name — Face Gallery                                      │
│                                                                     │
│   [+ Add Pictures]  [+ Add Pictures (Bulk)]                         │
│                                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │          │ │          │ │          │ │          │               │
│ │          │ │          │ │          │ │          │               │
│ │  [img]   │ │  [img]   │ │  [img]   │ │  [img]   │               │
│ │          │ │          │ │          │ │          │               │
│ │       [X]│ │       [X]│ │       [X]│ │       [X]│               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                     │
│ (empty state: "No face pictures yet. Add some!")                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Description |
|---|---|
| **[+ Add Pictures]** | Opens file picker (accepts images: png, jpg, gif, webp). Single or multiple files. Uploads to server, converts to WebP, adds to gallery. |
| **[+ Add Pictures (Bulk)]** | Same as above but explicitly allows multi-select. Same implementation — both buttons open a file picker with `multiple` enabled. Merged into one button with `multiple` always enabled. Decision: **single "Add Pictures" button** with multi-select always on. |
| **[X] on each image** | Small button overlaid on the top-right corner of each image. Hover to reveal. Clicking shows a confirmation popup, then removes the image. |
| **Empty state** | Shown when no images exist for this set. |

### Add Pictures Flow

1. Click "Add Pictures".
2. Native file dialog opens (multi-select enabled, image files only).
3. Selected files are uploaded to server.
4. Server converts to WebP, stores in `data/images/face/`, creates DB records.
5. Gallery refreshes to show new images.
6. A toast notification confirms the number of added pictures.

### Remove Picture Flow

1. Hover over image to reveal [X] button overlaid on top-right.
2. Click [X].
3. Confirmation popup: "Remove this image?"
4. On confirm: delete from disk, delete DB record, re-render gallery.
5. Toast: "Image removed."

---

## Screen 5 — Body Gallery

### URL: `/character/[id]/body`

Identical layout and behavior to the Face Gallery (Screen 4), but for body images. Images stored in `data/images/body/`.

---

## Screen 6 — Edit Bio Modal

A modal dialog (overlaying the character detail screen):

```
┌─────────────────────────────────────────┐
│  Edit Bio                               │
│                                         │
│  [                                     ]│
│  [  Multi-line textarea                ]│
│  [  pre-filled with current bio         ]│
│  [                                     ]│
│                                         │
│            [Cancel]  [Save]             │
└─────────────────────────────────────────┘
```

- On Save: updates the character's bio, closes modal, re-renders detail screen.
- On Cancel: closes modal without changes.

---

## Screen 7 — Edit Labels Modal

A modal dialog (overlaying the character detail screen):

```
┌─────────────────────────────────────────┐
│  Edit Labels                            │
│                                         │
│  [Fantasy ✕] [Sci-Fi ✕] [Villain ✕]   │
│                                         │
│  [+ Add Label ▼]  (dropdown of existing)│
│  [Type to create new label...]          │
│                                         │
│            [Cancel]  [Save]             │
└─────────────────────────────────────────┘
```

- Shows currently assigned labels as removable badges.
- "Add Label" dropdown shows all existing unassigned labels.
- Typing a new label name creates it on Save.
- On Save: updates character-label associations, creates any new labels.

---

## Screen 8 — Import/Export

Accessible from a settings/gear icon in the main header.

### Export

- Click "Export Data" → server generates ZIP → browser downloads it.
- ZIP contains `export.json` + `images/` directory (see data-model doc).

### Import

- Click "Import Data" → file picker opens (`.zip` only).
- Modal dialog appears with options:
  - **Replace all data** ( wipes current DB and images, then imports )
  - **Merge with existing** ( adds only new records, skips existing IDs )
- On confirm: server processes the ZIP, reports progress, refreshes the gallery on completion.
- Toast: "Imported X characters, Y images."

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `>= 1024px` (desktop) | Full 3-column layout on character detail. 4-column gallery grid. |
| `768px - 1023px` (tablet) | 3-column gallery grid. Character detail stacks: bio on top, face/body side-by-side below. |
| `< 768px` (mobile) | 2-column gallery grid. Character detail stacks vertically: face pic → bio → body pic. |

## Animations & Transitions

- **Card hover**: subtle scale-up (`scale(1.03)`) + shadow increase, 150ms ease.
- **Image rotation**: crossfade transition (opacity), 500ms ease.
- **Modal open/close**: fade in/out, 200ms.
- **Page transitions**: Next.js default (no custom transition library needed).