# Character Gallery

A web application for managing roleplay character collections with face and body image sets, labels, and full CRUD operations.

## Features

### Character Management
- Create, edit, and delete characters
- Each character has a name, bio, and optional labels
- View characters in a grid gallery with thumbnail previews
- Random character selection

### Image Galleries
- Separate face and body image sets per character
- Bulk upload support (up to 50 files at once)
- Fullscreen lightbox viewer with keyboard navigation (arrow keys, ESC)
- Click any image to view it fullscreen
- Images are automatically converted to WebP format (2048x2048 max, 85% quality)

### Label System
- Create and manage colored labels
- Assign multiple labels to characters
- Filter characters by labels (AND/OR mode)
- Exclude characters by one or more labels
- Cascade delete labels from all characters

### Gallery Controls
- Toggle between face and body pic sets
- Sort characters by: name (A→Z / Z→A), creation date (oldest/newest), or random
- Filter by multiple labels with AND/OR logic

### Import/Export
- Export all data to a ZIP backup file (includes database + all images)
- Import from a previous backup (replace or merge mode)
- Easy offline backup and restore

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS 4 + shadcn/ui (base-ui variant)
- **Package Manager**: pnpm

## Data Storage

- **Database**: `data/gallery.db` (SQLite file)
- **Images**: `data/images/face/` and `data/images/body/`
- All data is stored locally — no external database required

## Data Model

```
Character
  - id (UUID)
  - name
  - bio
  - createdAt
  - updatedAt

Label
  - id (UUID)
  - name (unique)
  - color (hex, optional)
  - createdAt

Image
  - id (UUID)
  - characterId (FK)
  - type: "face" | "body"
  - filename (UUID.webp)
  - originalName
  - createdAt
```

Character-Label is a many-to-many relationship via `character_labels` junction table.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/characters` | List characters (supports `picSet`, `sortBy`, `sortOrder`, `labelFilterMode`, `labels`, `excludeLabels` params) |
| POST | `/api/characters` | Create character |
| GET | `/api/characters/random` | Get random character (respects label and exclusion filters) |
| GET | `/api/characters/[id]` | Get character details |
| PATCH | `/api/characters/[id]` | Update character (name, bio, labels) |
| DELETE | `/api/characters/[id]` | Delete character (cascades to images) |
| GET | `/api/characters/[id]/images` | List images for character |
| POST | `/api/characters/[id]/images` | Upload images (multipart, multiple files) |
| DELETE | `/api/characters/[id]/images/[imageId]` | Delete single image |
| GET | `/api/images/[...path]` | Serve image file |
| GET | `/api/labels` | List all labels |
| POST | `/api/labels` | Create label |
| DELETE | `/api/labels/[id]` | Delete label |
| DELETE | `/api/labels/[id]/cascade` | Delete label and remove from all characters |
| POST | `/api/export` | Export all data as ZIP |
| POST | `/api/import` | Import data from ZIP backup |
