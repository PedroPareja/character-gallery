# API Design

All API routes live under `/api/`. Requests and responses use JSON unless otherwise noted.

## Characters

### `GET /api/characters`

List all characters, optionally filtered by labels.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `labels` | `string` | Comma-separated label IDs to filter by. Characters must have at least one matching label. |
| `excludeLabels` | `string` | Comma-separated label IDs to exclude. Characters with any of these labels are removed from the results. |
| `picSet` | `"face" \| "body"` | Which image set to include a random pic URL for. Default: `"face"`. |

**Response `200`:**

```json
{
  "characters": [
    {
      "id": "uuid",
      "name": "Aria Nightwhisper",
      "bio": "An elven rogue...",
      "labels": [
        { "id": "uuid", "name": "Fantasy", "color": "#8B5CF6" }
      ],
      "randomPicUrl": "/api/images/face/<uuid>.webp",
      "facePicCount": 5,
      "bodyPicCount": 3,
      "createdAt": "2026-06-17T12:00:00Z",
      "updatedAt": "2026-06-17T12:00:00Z"
    }
  ]
}
```

- If the character has no images in the requested `picSet`, `randomPicUrl` is `null`.
- `randomPicUrl` changes on each request (different random image each time).

---

### `POST /api/characters`

Create a new character.

**Request Body:**

```json
{
  "name": "Aria Nightwhisper",
  "bio": "An elven rogue from the Shadowvale...",
  "labelIds": ["uuid1", "uuid2"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Character name, 1–100 chars |
| `bio` | `string` | No | Bio/description, max 10,000 chars |
| `labelIds` | `string[]` | No | Existing label IDs to assign |

**Response `201`:**

```json
{
  "character": {
    "id": "uuid",
    "name": "Aria Nightwhisper",
    "bio": "An elven rogue from the Shadowvale...",
    "labels": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Response `400`:** Validation error (e.g. empty name).

---

### `GET /api/characters/[id]`

Get a single character with full details, labels, and image counts.

**Response `200`:**

```json
{
  "character": {
    "id": "uuid",
    "name": "Aria Nightwhisper",
    "bio": "An elven rogue from the Shadowvale...",
    "labels": [
      { "id": "uuid", "name": "Fantasy", "color": "#8B5CF6" }
    ],
    "facePicCount": 5,
    "bodyPicCount": 3,
    "createdAt": "2026-06-17T12:00:00Z",
    "updatedAt": "2026-06-17T12:00:00Z"
  }
}
```

**Response `404`:** Character not found.

---

### `PATCH /api/characters/[id]`

Update a character's name, bio, or label assignments.

**Request Body (partial):**

```json
{
  "name": "Aria Nightwhisper",
  "bio": "Updated bio text...",
  "labelIds": ["uuid1", "uuid3"]
}
```

- All fields are optional. Only provided fields are updated.
- If `labelIds` is provided, it **replaces** the current label assignments entirely.

**Response `200`:** Updated character object.

**Response `404`:** Character not found.

---

### `DELETE /api/characters/[id]`

Delete a character and all associated data (images removed from disk, DB records cascade-deleted).

**Response `200`:**

```json
{ "success": true }
```

**Response `404`:** Character not found.

---

### `GET /api/characters/[id]/random-pic?type=face|body`

Get a random image URL for the character's face or body gallery. Used by the client to implement auto-rotation without reloading the full character data.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `type` | `"face" \| "body"` | **Yes** | Which gallery to pick from |

**Response `200`:**

```json
{
  "imageUrl": "/api/images/face/<uuid>.webp",
  "imageId": "uuid"
}
```

- If the character has no images in that set, `imageUrl` is `null`.

---

### `GET /api/characters/random`

Get a random character ID from the set matching current filters.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `labels` | `string` | Comma-separated label IDs to filter by (same logic as `GET /api/characters`). |
| `excludeLabels` | `string` | Comma-separated label IDs to exclude (same logic as `GET /api/characters`). |

**Response `200`:**

```json
{
  "characterId": "uuid"
}
```

- If no characters match the filter, returns `404` with `{ "error": "No characters match the current filter" }`.

---

## Images

### `GET /api/characters/[id]/images?type=face|body`

List all images for a character's face or body gallery.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `type` | `"face" \| "body"` | **Yes** | Which gallery |

**Response `200`:**

```json
{
  "images": [
    {
      "id": "uuid",
      "url": "/api/images/face/<uuid>.webp",
      "originalName": "aria_face_01.png",
      "createdAt": "2026-06-17T12:00:00Z"
    }
  ]
}
```

---

### `POST /api/characters/[id]/images`

Upload one or more images to a character's gallery. Uses `multipart/form-data`.

**Request (`multipart/form-data`):**

| Field | Type | Description |
|---|---|---|
| `type` | `string` | `"face"` or `"body"` |
| `files` | `File[]` | Image files (png, jpg, gif, webp). Max 20 files per request. Max 10MB per file. |

**Response `201`:**

```json
{
  "images": [
    {
      "id": "uuid",
      "url": "/api/images/face/<uuid>.webp",
      "originalName": "aria_face_01.png",
      "createdAt": "2026-06-17T12:00:00Z"
    }
  ]
}
```

**Response `400`:** Validation error (wrong type, no files, too many files, file too large).

**Response `404`:** Character not found.

---

### `DELETE /api/characters/[id]/images/[imageId]`

Delete a single image.

**Response `200`:**

```json
{ "success": true }
```

**Response `404`:** Image not found.

---

### `GET /api/images/[...path]`

Serve an image file from the `data/images/` directory.

**Path:** `face/<uuid>.webp` or `body/<uuid>.webp`

- Sets appropriate `Content-Type` header (`image/webp`).
- Sets cache headers: `Cache-Control: public, max-age=31536000, immutable`.

---

## Labels

### `GET /api/labels`

List all labels.

**Response `200`:**

```json
{
  "labels": [
    { "id": "uuid", "name": "Fantasy", "color": "#8B5CF6", "characterCount": 3 },
    { "id": "uuid", "name": "Sci-Fi", "color": "#3B82F6", "characterCount": 2 }
  ]
}
```

- `characterCount` is the number of characters assigned to each label.

---

### `POST /api/labels`

Create a new label.

**Request Body:**

```json
{
  "name": "Fantasy",
  "color": "#8B5CF6"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | **Yes** | Label name, 1–50 chars, must be unique |
| `color` | `string` | No | Hex color. Default: auto-generated from name hash |

**Response `201`:**

```json
{
  "label": { "id": "uuid", "name": "Fantasy", "color": "#8B5CF6", "characterCount": 0 }
}
```

**Response `409`:** Label name already exists.

---

### `DELETE /api/labels/[id]`

Delete a label and remove all character-label associations.

**Response `200`:**

```json
{ "success": true }
```

**Response `404`:** Label not found.

---

## Data Transfer (Export / Import)

### `POST /api/export`

Export all data as a ZIP file.

**Response `200`:**

- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="character-gallery-export-20260617.zip"`
- Body: ZIP file containing `export.json` + `images/` directory.

---

### `POST /api/import`

Import data from a ZIP file. Uses `multipart/form-data`.

**Request (`multipart/form-data`):**

| Field | Type | Description |
|---|---|---|
| `file` | `File` | ZIP file exported by the export endpoint |
| `mode` | `string` | `"replace"` or `"merge"` |

**`mode` behavior:**

| Mode | Behavior |
|---|---|
| `replace` | Wipe current DB, delete all current images, then import everything from ZIP |
| `merge` | Add records that don't exist by ID; skip records with matching IDs; copy new images, skip existing filenames |

**Response `200`:**

```json
{
  "success": true,
  "stats": {
    "charactersImported": 12,
    "labelsImported": 5,
    "imagesImported": 34
  }
}
```

**Response `400`:** Invalid ZIP, schema version mismatch, or missing `export.json`.

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common error codes:

| Code | HTTP Status | Description |
|---|---|---|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Duplicate resource |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds 10MB |
| `TOO_MANY_FILES` | 400 | More than 20 files in one upload |
| `INVALID_IMPORT` | 400 | Import ZIP is invalid or corrupted |

---

## Client-Side Data Fetching Strategy

- **Main gallery (`/`):** Fetch character list on page load. Refetch when label filter changes.
- **Character detail (`/character/[id]`):** Fetch character data on page load. For auto-rotating pics, poll `/api/characters/[id]/random-pic` every N seconds (configurable delay).
- **Gallery screens:** Fetch image list on page load. After upload, refetch the list.
- **Mutations (create, update, delete):** Use optimistic updates where appropriate. Refetch relevant data after mutations.