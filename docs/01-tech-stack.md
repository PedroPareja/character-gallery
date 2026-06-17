# Tech Stack

## Runtime & Framework

| Layer | Choice | Rationale |
|---|---|---|
| Package manager | **pnpm** | Requested; fast, disk-efficient, strict dependency resolution |
| Framework | **Next.js 15 (App Router)** | Full-stack: SSR/SSG + API routes in one project; simplest option for a monolith |
| Language | **TypeScript** | Type safety across frontend and backend |
| Database | **SQLite via better-sqlite3** | Zero-config, single-file DB; ships with the app; trivial to backup (copy the file) |
| Images | **File system** (`data/images/`) | Serve via Next.js `public` or custom static route; no object-storage dependency |
| ORM | **Drizzle ORM** | Lightweight, type-safe, excellent SQLite support; simpler than Prisma for this scale |

## UI Layer

| Layer | Choice | Rationale |
|---|---|---|
| Styling | **Tailwind CSS 4** | Utility-first, fast iteration, modern defaults |
| Components | **shadcn/ui** | Copy-paste components built on Radix + Tailwind; accessible, customizable |
| Icons | **Lucide React** | Consistent icon set, ships with shadcn/ui |
| Animations | **CSS transitions + Tailwind** | No extra library needed for simple fades and transitions |

## Tooling

| Tool | Choice | Rationale |
|---|---|---|
| Linting | **ESLint** (Next.js config) | Standard for Next.js projects |
| Formatting | **Prettier** | Consistent code style |

## Project Structure

```
character-gallery/
├── data/                    # Runtime data (git-ignored)
│   ├── gallery.db           # SQLite database
│   └── images/              # Uploaded images
│       ├── face/
│       └── body/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Main screen (gallery)
│   │   ├── character/
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Character detail screen
│   │   │       ├── face/
│   │   │       │   └── page.tsx   # Face gallery
│   │   │       └── body/
│   │   │       │   └── page.tsx   # Body gallery
│   │   ├── new/
│   │   │   └── page.tsx     # Create character
│   │   └── api/             # API routes
│   │       ├── characters/
│   │       ├── labels/
│   │       ├── export/
│   │       └── import/
│   ├── components/          # Shared UI components
│   │   ├── ui/              # shadcn/ui primitives
│   │   └── ...              # App-specific components
│   ├── lib/                 # Utilities, DB, helpers
│   │   ├── db/              # Drizzle schema, connection, migrations
│   │   └── utils.ts
│   └── types/               # Shared TypeScript types
├── docs/                    # Design documents
├── public/                  # Static assets (favicon, etc.)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

## Why not ...?

| Alternative | Reason to skip |
|---|---|
| Express + SPA | Two separate projects; more boilerplate for routing, SSR, bundling |
| PostgreSQL | Requires external service; overkill for a personal gallery |
| MongoDB | External dependency; JSON files would serve the same purpose at this scale |
| React Router SPA | No built-in server; need separate backend for file uploads and storage |
| MUI / Chakra | Heavier; more opinionated; shadcn/ui is lighter and easier to customize |