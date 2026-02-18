# EDØR - Place-Based Music & Culture

## Overview

EDØR is a place-based music and culture discovery platform. Users "pulse" at physical locations to unlock audio content (music drops) tied to those places. The app supports two modes: "discover" (finding new content) and "park" (stationary listening). Key features include location-based content unlocking, "Listening Circles" (synchronized group listening rooms with QR code sharing), a personal library of unlocked content, and an admin panel for managing locations, content, and assignments.

The project is a full-stack TypeScript application with a PostgreSQL backend. All data (locations, contents, assignments, unlocked sessions, library) is persisted in the database and served via REST API. Client-side session state (mode, active room) remains in localStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` plugin), dark theme by default (black background with amber/gold primary color)
- **Animations**: Framer Motion for transitions and particle effects
- **Fonts**: Geist (sans-serif) and Libre Baskerville (serif) from Google Fonts
- **Maps**: pigeon-maps for location visualization on the Pulse page
- **QR Codes**: qrcode.react for Listening Circle sharing

### Client-Side Data Layer
- `client/src/lib/api.ts` provides TanStack React Query hooks (`usePulseData`, `useDrops`, `useLibrary`, etc.) and mutation hooks for all CRUD operations against the REST API.
- `client/src/lib/edorSession.ts` manages ephemeral client session state (mode, active room, selected location) in localStorage.
- `client/src/lib/edorStore.ts` is a legacy file with localStorage-based mock data management (no longer used by main pages).

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed with tsx
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Build**: Custom build script using esbuild for server and Vite for client. Production output goes to `dist/` with server as `dist/index.cjs` and client as `dist/public/`.

### API Routes
All routes are in `server/routes.ts`:
- `GET/POST/PATCH/DELETE /api/locations` — CRUD for physical locations
- `GET/POST/PATCH/DELETE /api/contents` — CRUD for audio content items
- `GET/POST/PATCH/DELETE /api/assignments` — CRUD for location↔content assignments (with time windows)
- `GET /api/assignments/active` — Active assignments (within current time window)
- `GET /api/pulse-data` — Combined locations + contents + active assignments (main data endpoint)
- `GET /api/drops` — Enriched active drops (assignment + content + location)
- `POST /api/unlock` — Record an unlock event and auto-add to library
- `GET /api/unlocked-sessions` — List unlock history
- `GET /api/library` — User's saved library of unlocked content
- `POST /api/seed` — Seed database with demo data (development only)

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Six tables:
  - `users` — id, username, password, displayName, phone
  - `locations` — id, name, description, lat, lng, isPermanent
  - `contents` — id, title, creator, description, audioUrl, artworkSeed
  - `assignments` — id, locationId, mode, contentId, startAt, endAt, createdAt
  - `unlockedSessions` — id, userId, nodeId, contentId, mode, unlockedAt
  - `libraryItems` — id, userId, contentId, and additional metadata
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync
- **Connection**: `pg.Pool` via `DATABASE_URL` environment variable
- **Validation**: drizzle-zod generates Zod schemas from Drizzle table definitions

### Storage Interface
- `server/storage.ts` defines an `IStorage` interface with methods for all CRUD operations
- Implementation uses Drizzle ORM queries against PostgreSQL

### Key Pages
- `/` — Home: Mode selection (discover/park), location display, drop previews
- `/pulse` — Geolocation-based content unlocking with map view
- `/content/:contentId` — Audio player with playback controls, circle launch
- `/circle` — Listening Circle room (synchronized playback, QR sharing, chat-like UI)
- `/library` — User's unlocked content collection
- `/admin` — Admin panel (passcode-protected, manages locations/content/assignments)
- `/login`, `/signup`, `/forgot-password`, `/profile` — Auth and profile pages

### Development vs Production
- **Development**: Vite dev server with HMR proxied through Express, with Replit-specific plugins (cartographer, dev-banner)
- **Production**: Static file serving from `dist/public/`, SPA fallback to `index.html`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication (Planned/Partial)
- **Supabase**: Used for OAuth authentication (Google and Apple sign-in)
  - Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
  - Google OAuth and Apple OAuth configured through Supabase dashboard
  - Currently in transition — auth pages exist but full integration may be incomplete

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit**: Database ORM and migration tooling
- **express**: HTTP server framework (v5)
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animation library
- **pigeon-maps**: Map component for location display
- **qrcode.react**: QR code generation for circle sharing
- **sonner**: Toast notifications (used alongside shadcn toast)
- **wouter**: Client-side routing
- **zod**: Schema validation
- **react-day-picker**: Calendar component
- **recharts**: Charting library (available via shadcn chart component)
- **vaul**: Drawer component