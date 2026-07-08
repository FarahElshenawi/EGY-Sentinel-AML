# Sentinel AML — Frontend (Next.js 16)

The investigation platform frontend. Light & clinical enterprise design system built from atomic components.

## Quick Start

```bash
# From the demo/ directory
npm install
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/cases` (the Investigation Queue).

## What it does

1. **`/cases`** — Investigation Queue. Homepage. Lists all flagged accounts ranked by risk score. Filter by pattern type, search by account ID.
2. **`/cases/[id]`** — Case Workspace. Two-pane layout: left = AI assessment + evidence + narrative, right = graph/audit toggle. Persistent decision panel (escalate / close / review / report).
3. **`/graph`** — Graph Explorer. Full-screen transaction network. Filter by pattern, click nodes to open the drawer, "Open case" to investigate.
4. **`/reports`** — Reports. Compliance table view of all cases for regulatory export.
5. **`/settings`** — Settings. User profile + system status.

## Design System

**Palette**: Light & clinical. Off-white canvas (`#FAFBFC`), white surfaces, navy brand (`#0A2B5C`), orange accent (`#FFA500`) from the logo.

**Typography**: 3 typefaces —
- Inter (UI chrome: buttons, labels, tables)
- JetBrains Mono (data: account IDs, amounts, timestamps — tabular nums)
- Source Serif 4 (AI narrative + case report — signals "document, read carefully")

**Spacing**: 4px base grid. All paddings/margins use `--space-*` tokens.

**Radius**: 4px default (calm), 8px for cards, 12px for modals.

**Risk colors**: Used on indicators only (dots, badges, gauge), never as background fill. 4 levels: critical / high / medium / low.

## Architecture

```
demo/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (fonts, sidebar)
│   ├── page.tsx                # Redirects to /cases
│   ├── globals.css             # Design system tokens
│   ├── cases/
│   │   ├── page.tsx            # Investigation Queue
│   │   └── [id]/page.tsx       # Case Workspace
│   ├── graph/page.tsx          # Graph Explorer
│   ├── reports/page.tsx        # Reports
│   └── settings/page.tsx       # Settings
├── components/                 # Atomic component architecture
│   ├── atoms/                  # Badge, Button, RiskDot, Citation, Spinner
│   ├── molecules/              # RiskGauge, CaseRow, FilterChip, SearchInput, ConfidenceMeter
│   ├── organisms/              # Sidebar, TopBar, DecisionPanel, AuditTrail, AgentTrace
│   ├── templates/              # AppShell
│   ├── agent-trace/            # JsonViewer (audit pane)
│   ├── GraphCanvas.tsx         # react-force-graph-2d wrapper
│   └── Logo.tsx                # SVG shield logo
├── lib/
│   ├── api.ts                  # Typed API client (calls FastAPI)
│   └── format.ts               # Money/number/date formatters
├── types/
│   └── index.ts                # TypeScript types (match Pydantic models)
├── public/
│   ├── logo.svg                # Shield logo
│   └── logo.png
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

## Prerequisites

- **FastAPI server running** on http://localhost:8000
  ```bash
  # From project root
  uvicorn egysentinel.api.main:app --reload
  ```

- **Node.js 20+** (Next.js 16 requirement)
  ```bash
  node --version
  ```

## Troubleshooting

**"Cannot reach API at http://localhost:8000"**
FastAPI server isn't running. Start it with `uvicorn egysentinel.api.main:app --reload`

**Graph doesn't render**
Check browser console for errors. `react-force-graph-2d` needs `window` — it's loaded dynamically with `ssr: false`.

**CORS errors in browser console**
FastAPI CORS middleware allows `localhost:3000`. If you changed the port, update `egysentinel/api/main.py`.

**Fonts not loading**
The layout uses `next/font/google` to load Inter, JetBrains Mono, and Source Serif 4. These are fetched at build time — ensure you have internet access on first `npm run dev`.
