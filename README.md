# Draftpad

A local-first collaborative document editor with offline sync, deterministic conflict resolution via Yjs CRDT, and AI-powered writing assistance.

## Features

- **Local-First Architecture** — Works fully offline. IndexedDB is the primary source of truth.
- **Background Sync Engine** — Queues changes offline, syncs automatically on reconnect.
- **Yjs CRDT** — Deterministic conflict resolution. No data loss, ever.
- **Version History** — Save snapshots, browse timeline, restore safely.
- **Role-Based Access** — Owner / Editor / Viewer with server-enforced permissions.
- **AI Assist** — Groq-powered writing improvements, summarization, grammar fixes.
- **Responsive UI** — Full mobile + desktop experience.
- **Security** — Zod payload validation, size limits, OOM prevention, MongoDB scoping.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 + TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose |
| Auth | NextAuth v5 (JWT) |
| Local Storage | Dexie.js (IndexedDB) |
| CRDT | Yjs |
| AI | Groq (llama-3.3-70b) |
| Deployment | Vercel |

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in MONGODB_URI, NEXTAUTH_SECRET, GROQ_API_KEY

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Random secret (min 32 chars) — run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL (`http://localhost:3000` in dev) |
| `GROQ_API_KEY` | Free at [console.groq.com](https://console.groq.com) |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, Register
│   ├── api/               # All API routes
│   ├── dashboard/         # Document list
│   └── docs/[id]/         # Editor
├── components/
│   └── editor/            # Editor, Toolbar, AI Panel, etc.
├── hooks/                 # useDocument, useVersionHistory
├── lib/
│   ├── crdt/              # Yjs utilities
│   └── sync/              # SyncEngine + IndexedDB
├── server/
│   ├── auth.ts            # NextAuth config
│   ├── db/                # MongoDB models
│   └── validators/        # Zod schemas
└── types/                 # Shared TypeScript types
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — CI/CD handles subsequent pushes via `.github/workflows/ci.yml`

## Architecture Decisions

- **Why Yjs over manual OT?** Yjs is battle-tested CRDT used by Notion, Obsidian, Jupyter. Zero custom merge logic required.
- **Why MongoDB over PostgreSQL?** Document-oriented storage maps naturally to document state. Yjs binary states are blob values — MongoDB handles these efficiently.
- **Why Dexie over raw IndexedDB?** Dexie provides a clean Promise-based API over IndexedDB's callback hell.
- **OOM Prevention** — All sync payloads validated with Zod, hard-capped at 500KB. Server rejects oversized payloads before any processing.

---

Built by Shivaprasad | [GitHub](https://github.com/Shiva-prog-tech) | [LinkedIn](https://www.linkedin.com/in/shivaprasad-jokare)
