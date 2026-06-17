# Data Model

## Entity-Relationship Diagram

```
┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│  characters  │───┐   │ character_labels   │   ┌───│    labels    │
│──────────────│   │   │────────────────────│   │   │──────────────│
│ id (PK)      │───┤   │ character_id (FK)  │───┤   │ id (PK)      │
│ name         │   │   │ label_id (FK)       │   │   │ name         │
│ bio          │   │   └────────────────────┘   │   │ color        │
│ created_at   │   │                             │   │ created_at   │
│ updated_at   │   │                             └───└──────────────┘
└──────┬───────┘   │
       │           │
       │ 1         │
       │           │
       │ N         │
┌──────┴───────┐   │
│   images     │   │
│──────────────│   │
│ id (PK)      │   │
│ character_id │───┘
│ type         │   (type = "face" | "body")
│ filename     │
│ original_name│
│ created_at   │
└──────────────┘
```

## Tables

### `characters`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | PK, UUID | Unique character identifier |
| `name` | `TEXT` | NOT NULL | Character display name |
| `bio` | `TEXT` | DEFAULT '' | Bio / description (markdown-supported) |
| `created_at` | `TEXT` | NOT NULL, ISO 8601 | Creation timestamp |
| `updated_at` | `TEXT` | NOT NULL, ISO 8601 | Last update timestamp |

### `labels`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | PK, UUID | Unique label identifier |
| `name` | `TEXT` | NOT NULL, UNIQUE | Label name (e.g. "Fantasy", "Sci-Fi") |
| `color` | `TEXT` | DEFAULT NULL | Hex color for UI badge (e.g. "#8B5CF6") |
| `created_at` | `TEXT` | NOT NULL, ISO 8601 | Creation timestamp |

### `character_labels` (junction table)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `character_id` | `TEXT` | FK → characters.id, ON DELETE CASCADE | Character reference |
| `label_id` | `TEXT` | FK → labels.id, ON DELETE CASCADE | Label reference |

**Primary key:** `(character_id, label_id)`

### `images`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | PK, UUID | Unique image identifier |
| `character_id` | `TEXT` | FK → characters.id, ON DELETE CASCADE | Owning character |
| `type` | `TEXT` | NOT NULL, CHECK(type IN ('face','body')) | Which gallery the image belongs to |
| `filename` | `TEXT` | NOT NULL | Stored filename on disk (e.g. `abc123.webp`) |
| `original_name` | `TEXT` | DEFAULT NULL | Original upload filename for reference |
| `created_at` | `TEXT` | NOT NULL, ISO 8601 | Upload timestamp |

## File Storage

Images are stored on disk under `data/images/`:

```
data/images/
├── face/
│   ├── <uuid1>.webp
│   └── <uuid2>.webp
└── body/
    ├── <uuid3>.webp
    └── <uuid4>.webp
```

- Uploaded images are converted to **WebP** (for size efficiency) and stored with a UUID filename.
- The `filename` column stores just the relative path (e.g. `face/<uuid>.webp`).
- The `original_name` column preserves the user's original filename for display purposes.

## Seed / Empty State

When the database is first created (and no data exists), the app initializes with:
- Zero characters, zero labels.
- The main screen shows an empty state with a call-to-action to create the first character.

## Export / Import Format

### Export produces a ZIP file:

```
character-gallery-export-20260617.zip
├── export.json          # All table data serialized as JSON
└── images/
    ├── face/
    │   └── *.webp
    └── body/
        └── *.webp
```

### `export.json` structure:

```json
{
  "version": 1,
  "exported_at": "2026-06-17T12:00:00Z",
  "characters": [...],
  "labels": [...],
  "character_labels": [...],
  "images": [...]
}
```

### Import behavior:

1. Validate `export.json` schema version.
2. If the DB already has data, **merge** (upsert) or **replace** — the UI will offer both options:
   - **Replace:** Wipe current data, then import everything from the file.
   - **Merge:** Add characters/labels that don't exist by ID; skip duplicates.
3. Copy image files into `data/images/`, overwriting conflicts.
4. Update the database records.

This makes it trivial to:
- Back up by downloading the ZIP.
- Restore by uploading the ZIP.
- Transfer between machines.