# LangBlock

LangBlock is a small Next.js app for visually composing simple LLM “flows” and creating LangGraph projects.

Key pieces:
- A Flow Editor powered by `@xyflow/react` with blocks: Input → Prompt → LLM → Tool → Output
- A Project Scaffolder that uses the File System Access API to create/open a folder and write files
- One‑click export that overwrites `my_agent/agent.py` in the chosen folder (with download fallback)

## Requirements

- Node.js 18+ and npm
- A Chromium‑based browser (Chrome/Edge) to use the File System Access API
- Python 3.10+ if you plan to run the generated project
- Optionally, an OpenAI API key if you run LLM code locally

## Quick Start

1) Install and run the dev server

```bash
npm install
npm run dev
```

Open http://localhost:3000 or https://langblock.org in a Chromium browser.

2) Create/Open a project folder

- On the home screen, click “Create / Open Project”.
- Pick a project directory. If there is an existing LangGraph project in the directory, it will open it in the flow. Otherwise, a new project is scaffolded with:
  - `my_agent/agent.py`, `my_agent/utils/*`, `.env`, `requirements.txt`, `langgraph.json`
- After this, you are redirected to `/flow`.

3) Edit your flow and export

- Add blocks, edit labels/config in the inspector.
- Click “Save as Python”. The app will:
  - Overwrite `my_agent/agent.py` in the picked folder (asks for permission if needed), or
  - Fall back to downloading `agent.py` if no folder is available.

## Running the Generated Agent

In the same folder you created/opened in the app:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY=...   # set your key
python my_agent/agent.py
```

* you can add your OPENAI_API_KEY to the created .env file

## How It Works

- Flow Editor: `src/components/flow/FlowEditor.tsx`
  - Uses `@xyflow/react`, custom node `BlockNode`, and an inspector panel
  - Generates Python with `src/lib/codegen/python.ts`
  - On save, writes to `my_agent/agent.py` via the File System Access helpers
- Project Scaffolder: `src/components/home/ProjectScaffolder.tsx`
  - Creates or detects a minimal LangGraph agent project on disk
  - Persists the directory handle in a small Zustand store (`src/store/project.ts`)
- FS helpers: `src/lib/fs-access.ts`
  - `writeTextFile`, `ensureDir`, and permission helpers for the FS Access API

Routing:
- `/` — Project scaffolding screen
- `/flow` — Flow Editor

## Project Structure

- `src/app` — Next.js app router pages
- `src/components/flow` — Flow editor, nodes, sidebar, inspector
- `src/components/home` — Project scaffolder UI
- `src/lib` — Python codegen, FS helpers, templates
- `src/store` — Zustand store for the selected directory

## Notes and Tips

- Fonts: If your environment blocks external network access, Next.js’ Google Fonts fetch can fail at build time. Use `npm run dev` or switch to local fonts if needed.
- Permissions: Browsers require explicit permission to write files. If permission is denied or a directory wasn’t chosen, the app downloads `agent.py` instead.
- Codegen: The Python generated from the Flow Editor is a lightweight mapping of the visual graph. The scaffolder’s Python is a minimal LangGraph app; you can swap in the generated logic by saving, then iterating inside `my_agent/agent.py`.
- Since the project is built on LangGraph, you can easily integrate `LangSmith` and run `LangGraph Studio` for debugging.

## Tech Stack

- Next.js, React, TypeScript
- `@xyflow/react` for graph editing
- Zustand for tiny client state
- Tailwind + shadcn/ui components

## License

MIT
