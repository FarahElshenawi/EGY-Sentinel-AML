# EGY-Sentinel AML — Frontend (Next.js 16)

Single-page graph dashboard for the EGY-Sentinel AML demo.

## Quick Start

```bash
# From the demo/ directory
npm install
npm run dev
```

Open http://localhost:3000

## What it does

1. Click **"Load Sample Scenario"** in the header
2. The graph renders (calls `GET /graph` on the FastAPI backend)
3. Click any node (account) in the graph
4. The right panel populates with:
   - **Alert** (from Alert Agent)
   - **Case Report** (from Case Builder Agent)
   - **Explanation** (from Explanation Agent)

## Architecture

```
demo/
├── app/
│   ├── layout.tsx       ← Root layout (fonts, metadata)
│   ├── page.tsx         ← Main dashboard (state management)
│   └── globals.css      ← Tailwind + custom styles
├── components/
│   ├── Header.tsx              ← Top bar + "Load Sample" button
│   ├── GraphCanvas.tsx         ← react-force-graph-2d wrapper
│   ├── SidePanel.tsx           ← Container for 3 panels
│   ├── AlertPanel.tsx          ← Alert Agent output
│   ├── CasePanel.tsx           ← Case Builder Agent output
│   └── ExplanationPanel.tsx    ← Explanation Agent output
├── lib/
│   └── api.ts           ← Typed API client (calls FastAPI)
├── types/
│   └── index.ts         ← TypeScript types (match Pydantic models)
├── package.json
├── tsconfig.json
├── next.config.js       ← API proxy config
├── tailwind.config.ts
└── postcss.config.js
```

## Prerequisites

- **FastAPI server running** on http://localhost:8000
  ```bash
  # From project root
  uvicorn egysentinel.api.main:app --reload
  ```

- **Node.js 18.18+ or 20+** (Next.js 16 requirement)
  ```bash
  node --version
  ```

## Troubleshooting

**"Cannot reach API at http://localhost:8000"**
→ FastAPI server isn't running. Start it with `uvicorn egysentinel.api.main:app --reload`

**Graph doesn't render**
→ Check browser console for errors. react-force-graph-2d needs `window` — it's loaded dynamically with `ssr: false`.

**CORS errors in browser console**
→ FastAPI CORS middleware allows `localhost:3000`. If you changed the port, update `egysentinel/api/main.py`.

**Module not found: react-force-graph-2d**
→ Run `npm install` again. The package is in `package.json`.
