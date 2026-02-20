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
- `GET /api/users/search?q=` — Search users by username/displayName
- `POST /api/friends/request` — Send friend request
- `GET /api/friends?userId=` — List accepted friends
- `GET /api/friends/pending?userId=` — Pending incoming requests
- `GET /api/friends/sent?userId=` — Sent outgoing requests
- `PATCH /api/friends/:id/accept` — Accept friend request
- `PATCH /api/friends/:id/decline` — Decline friend request
- `DELETE /api/friends/:id` — Remove friendship
- `GET /api/status/:userId` — Get user listening status
- `PUT /api/status` — Update user status (currently listening, online, etc.)
- `GET /api/friends/statuses?userId=` — Get all friends' statuses
- `GET /api/friends/shared-library?userId=` — Find friends with shared tracks
- `POST /api/listen-chats` — Create a listen chat room
- `GET /api/listen-chats` — Active listen chats (or filtered by userId)
- `GET /api/listen-chats/:id` — Get chat with members
- `POST /api/listen-chats/:id/join` — Join a listen chat
- `POST /api/listen-chats/:id/leave` — Leave a listen chat
- `POST /api/listen-chats/:id/close` — Close a listen chat
- `GET /api/listen-chats/:id/messages` — Get chat messages
- `POST /api/listen-chats/:id/messages` — Send a chat message
- `POST /api/seed-social` — Seed demo social data (development only)
- `POST /api/uploads/request-url` — Get presigned URL for file upload (audio, artwork, video)
- `GET /objects/*` — Serve uploaded files from object storage

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (`shared/schema.ts`): Eleven tables:
  - `sessions` — sid, sess, expire (Replit Auth session storage)
  - `users` — id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt
  - `locations` — id, name, description, lat, lng, isPermanent
  - `contents` — id, title, creator, description, audioUrl, artworkSeed, artworkUrl, videoUrl
  - `assignments` — id, locationId, mode, contentId, startAt, endAt, createdAt
  - `unlockedSessions` — id, userId, nodeId, contentId, mode, unlockedAt
  - `libraryItems` — id, userId, contentId, and additional metadata
  - `friendships` — id, senderId, receiverId, status (pending/accepted/declined), createdAt
  - `userStatus` — id, userId, displayName, currentContent info, statusText, isOnline, lastSeen
  - `listenChats` — id, name, contentId/Title/Artist, audioUrl, createdBy, isActive
  - `listenChatMembers` — id, chatId, userId, displayName, joinedAt
  - `chatMessages` — id, chatId, userId, displayName, message, sentAt
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync
- **Connection**: `pg.Pool` via `DATABASE_URL` environment variable
- **Validation**: drizzle-zod generates Zod schemas from Drizzle table definitions

### Storage Interface
- `server/storage.ts` defines an `IStorage` interface with methods for all CRUD operations
- Implementation uses Drizzle ORM queries against PostgreSQL

### Object Storage
- Replit Object Storage for file uploads (audio, artwork, video)
- `server/replit_integrations/object_storage/` — GCS-backed presigned URL upload flow
- `client/src/components/ObjectUploader.tsx` — Uppy v5 upload modal component
- `client/src/hooks/use-upload.ts` — React hook for custom upload UI

### Key Pages
- `/` — Home: Mode selection (discover/park), location display, drop previews
- `/pulse` — Geolocation-based content unlocking with map view
- `/content/:contentId` — Audio player with playback controls, circle launch
- `/circle` — Listening Circle room (synchronized playback, QR sharing, chat-like UI)
- `/library` — User's unlocked content collection
- `/social` — Friends list, activity feed, friend requests, shared library discovery
- `/listen-chat` — Listen Chat rooms (group listening with built-in chat for friends with shared tracks)
- `/admin` — Admin panel (passcode-protected, manages locations/content/assignments)
- `/upload` — Content upload page for artists/clients (drag-and-drop audio, artwork, video uploads via object storage)
- `/login` — Guest login page (username: "guest", password: "edor")
- `/profile` — User profile and settings page

### Development vs Production
- **Development**: Vite dev server with HMR proxied through Express, with Replit-specific plugins (cartographer, dev-banner)
- **Production**: Static file serving from `dist/public/`, SPA fallback to `index.html`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication
- **Replit Auth**: OpenID Connect authentication via Replit
  - Auth module in `server/replit_integrations/auth/` (replitAuth.ts, storage.ts, routes.ts)
  - Client hook: `client/src/hooks/use-auth.ts` (useAuth hook)
  - Routes: `/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`
  - Session storage in PostgreSQL `sessions` table via connect-pg-simple
  - Protected routes require authentication; unauthenticated users redirected to /login
  - User data: id, email, firstName, lastName, profileImageUrl from Replit OIDC claims

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