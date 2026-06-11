# AGENTS.md

## Cursor Cloud specific instructions

CineFlex is a single **Next.js 16** (App Router, Turbopack, React 19) application managed with **pnpm**. There is no database or backend service — projects are persisted client-side in `localStorage` via Zustand, and the `/api/projects` routes are stubs. All AI features (prompt enhancement, image/video/audio generation) have built-in local/free fallbacks, so the app runs and the core flows work **without any API keys**.

### Services
- **Web app (only service)** — Next.js dev server on port 3000.
  - Dev: `pnpm dev` (run in a tmux session; it's long-running).
  - Build: `pnpm build` (production build succeeds).
  - Start prod build: `pnpm start`.

### Run / test caveats
- **Lint is not configured in this repo.** The `lint` script is `eslint .`, but `eslint` is not a dependency and there is no ESLint config, so `pnpm lint` fails with `eslint: not found`. This is a pre-existing repo issue, not an environment problem.
- **TypeScript errors are ignored at build time** (`next.config.mjs` sets `typescript.ignoreBuildErrors: true`), so a green build does not guarantee type-correctness. Run `pnpm exec tsc --noEmit` for real type checking.
- There are **no automated tests** in the repo.
- `images.unoptimized: true` is set, so the ignored `sharp` build script during `pnpm install` is harmless and does not need approval.
- The `middleware.ts` deprecation warning ("use proxy instead") is expected on Next 16 and harmless.

### Optional API keys (enable real AI instead of fallbacks)
Set in a `.env.local` (gitignored). All optional — app works without them:
- `GROQ_API_KEY` — real LLM agent analysis/enhancement (otherwise local text fallback).
- `RUNWARE_API_KEY` — image/video generation (otherwise free Pollinations.ai fallback for images).
- `ELEVENLABS_API_KEY` — voiceover. `POPCORN_API_KEY` / `ANTHROPIC_API_KEY` — additional providers.
Check current key status at runtime via `GET /api/status`.
