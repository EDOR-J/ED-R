# EDØR — Place-Based Music & Culture

EDØR is a location-based music discovery platform. Users physically visit city locations (or tap NFC tags) to unlock exclusive audio content tied to those places. Think of it as a city-wide treasure hunt for music.

## Features

- **Discover & Park modes** — Discover new content while moving around the city, or Park at a location for a longer, uninterrupted listening session
- **GPS & NFC unlocking** — Walk near a node to unlock its tracks, or tap a physical NFC tag for instant access without GPS
- **Listening Circles** — Create or join a synchronized group listening room; share via QR code so friends can listen together in real time
- **Library** — A personal collection of every track you've unlocked
- **Social** — Add friends, see what they're listening to, start a private listen-chat with friends who share a track
- **Artist dashboard** — Upload audio, artwork, and video; create location-based campaigns with time windows; track per-node play metrics
- **Admin panel** — Manage locations, content, assignments, and NFC slugs (passcode-protected)

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, TanStack React Query, Wouter
- **Backend**: Node.js + Express 5, TypeScript (tsx), Drizzle ORM
- **Database**: PostgreSQL
- **Storage**: Replit Object Storage (audio, artwork, video uploads)
- **Auth**: Email/password, Google Sign-In (optional), guest login

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies |
| `GOOGLE_CLIENT_ID` | No | Enables "Continue with Google" on the login page |

### Running Locally

```bash
npm install
npm run db:push   # sync database schema
npm run dev       # start dev server (Vite + Express)
```

The app runs at `http://localhost:5000` by default.

## Authentication

- **Email/password** — Register and log in with an email address and password
- **Google Sign-In** — Set `GOOGLE_CLIENT_ID` to enable the Google button on the login page (requires a Google Cloud OAuth 2.0 credential with the app's domain as an authorised origin)
- **Guest** — A one-tap "Continue as guest" button for limited, no-signup access (no persistent library)
- **Admin** — Separate Admin tab on the login page; use username `guest` / password `edor`

## Admin Panel

Access `/admin` after logging in as an admin user. From there you can:

- Add / edit / delete physical locations (with lat/lng and NFC slug)
- Upload and manage audio content
- Create assignments that link content to locations with optional time windows
- Copy NFC tag URLs directly from the location card
