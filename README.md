# Draftpad

A local-first, collaborative document editor with offline sync, deterministic conflict resolution via Yjs CRDT, AI-powered writing, and a built-in presentation builder — wrapped in a premium dark UI.

## Features

### Local-first & sync
- **Works fully offline** — IndexedDB is the primary source of truth.
- **Background sync engine** — queues changes while offline and syncs automatically on reconnect.
- **Yjs CRDT** — deterministic, lossless conflict resolution for concurrent edits.
- **Version history** — snapshot the document, browse the timeline, and restore safely.
- **Live presence** — collaborator avatars and online/offline status.

### Writing & editing
- **Rich text editor** (in-repo `@draftpad/rich-editor`) with a formatting toolbar and find & replace.
- **Slash commands** (`/`) — headings, lists, tables, code blocks, callouts, dividers, diagrams, doc links and AI Write.
- **Mermaid diagrams** — render flowcharts, sequence and ER diagrams from code.
- **Runnable code blocks** — execute code and see output inline (via the public Wandbox API).
- **Backlinks & doc links** — connect documents both ways into a knowledge graph.
- **Table of contents** — a live outline built from your headings.
- **Focus mode** — a distraction-free writing canvas.

### AI (Groq)
- **Inline actions** — select text to improve, summarize, fix grammar or shorten.
- **AI panel** — freeform generation plus AI **image generation** (free, via Pollinations).
- **AI document review** — a scored critique of clarity, structure and tone.
- **AI template generation** — describe a doc and get a structured, ready-to-fill draft.
- **AI slide decks** — generate a full, editable presentation from a topic.

### Collaboration & organization
- **Role-based access** — Owner / Editor / Viewer, server-enforced.
- **Comments** — thread on the whole document or on a selected passage.
- **Email invites** — invite collaborators by email (SMTP).
- **Dashboard** — document gallery with full-text search and a **⌘K command palette**.
- **Template Studio** — curated gallery, AI-generated docs, AI slide decks, and your own saved templates.
- **Workflow status** — move a document through Draft → In Review → Approved.

### Presentations & export
- **Slide decks** — AI generation, a deck editor, and a full-screen **present mode**.
- **Export** — Markdown, PDF (print), and PowerPoint **`.pptx`**.

### Onboarding
- **Guided product tour** — a premium spotlight walkthrough of every tool. Auto-starts once for first-time visitors on the dashboard and the editor, and is replayable anytime from the floating **Tour** launcher. Respects `prefers-reduced-motion`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 18 + TypeScript |
| Styling / UI | Tailwind CSS, Radix UI, Framer Motion, lucide-react |
| Database | MongoDB + Mongoose |
| Auth | NextAuth v5 (JWT) — credentials (bcrypt) + optional GitHub / Google / LinkedIn OAuth |
| Local storage | Dexie.js (IndexedDB) |
| CRDT | Yjs + y-indexeddb |
| AI (text) | Groq `llama-3.1-8b-instant` via the Vercel AI SDK |
| AI (images) | Pollinations (no key required) |
| Code runner | Wandbox public API |
| Diagrams | Mermaid |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel |

## Quick Start

> Requires **Node.js 20+**.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# At minimum, fill in MONGODB_URI, AUTH_SECRET and GROQ_API_KEY

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Webpack) |
| `npm run build` | Production build (Webpack) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

## Environment Variables

Copy `.env.local.example` to `.env.local`. The app runs with the **required** variables alone; the rest unlock optional features.

**Required**

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Random secret, min 32 chars — `openssl rand -base64 32` |
| `AUTH_URL` / `NEXTAUTH_URL` | App URL (`http://localhost:3000` in dev) |
| `GROQ_API_KEY` | Required for AI features — free at [console.groq.com](https://console.groq.com) |

**Optional**

| Variable | Description |
|---|---|
| `GITHUB_* / GOOGLE_* / LINKEDIN_*` | OAuth social login (email/password works without these) |
| `EMAIL_SERVER_*`, `EMAIL_FROM` | SMTP settings for sending invite emails |
| `NEXT_PUBLIC_APP_URL` | Public URL used in invite email links |
| `POLLINATIONS_MODEL` | AI image model — `turbo` (default) or `flux` |
| `WANDBOX_URL` | Override only if self-hosting the code runner |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login & register
│   ├── api/                  # Route handlers (ai, documents, decks, sync, search, versions, comments, invites, image, execute, auth)
│   ├── dashboard/            # Document gallery + Template Studio
│   ├── docs/[id]/            # Document editor
│   ├── decks/[id]/           # Slide-deck editor
│   ├── present/              # Presentation mode
│   └── invite/[token]/       # Invite acceptance
├── components/
│   ├── editor/               # Editor, AI panels, comments, versions, TOC, diagrams, code runner, backlinks…
│   ├── tour/                 # Guided product tour (spotlight engine + step definitions)
│   ├── ui/                   # Button, Card, Modal, SidePanel, Toaster
│   ├── CommandPalette.tsx    # ⌘K palette
│   └── DeckEditor.tsx        # Slide-deck editor
├── hooks/                    # useDocument, useVersionHistory, useOnlineStatus
├── lib/
│   ├── crdt/                 # Yjs utilities
│   ├── sync/                 # Offline sync engine
│   └── …                     # templates, deck, pptx, pdf/markdown export, ai-image, pollinations
├── packages/
│   └── rich-editor/          # In-repo @draftpad/rich-editor (contenteditable engine, toolbar, find/replace)
├── server/
│   ├── auth.ts, auth.config.ts   # NextAuth v5
│   ├── db/                   # Mongoose connection + models
│   ├── email.ts              # SMTP invites
│   └── validators/           # Zod schemas
└── types/                    # Shared TypeScript types
```

## Deployment (Vercel)

1. Push to GitHub.
2. Import the project in Vercel.
3. Add the environment variables in the Vercel dashboard.
4. Deploy — CI/CD handles subsequent pushes via `.github/workflows/ci.yml`.

## Architecture Decisions

- **Why Yjs over manual OT?** Yjs is a battle-tested CRDT (used by Notion, Obsidian, Jupyter). Zero custom merge logic, no data loss.
- **Why MongoDB over PostgreSQL?** Document-oriented storage maps naturally to document state, and Yjs binary states are stored efficiently as blob values.
- **Why Dexie over raw IndexedDB?** Dexie provides a clean Promise-based API over IndexedDB's callback model.
- **OOM prevention** — all sync payloads are validated with Zod and hard-capped; the server rejects oversized payloads before any processing.
- **AI cost & rate limits** — context is capped (~1.5k tokens) and requests time out gracefully to stay within Groq's free-tier limits.

---

Built by Shivaprasad | [GitHub](https://github.com/Shiva-prog-tech) | [LinkedIn](https://www.linkedin.com/in/shivaprasad-jokare)
