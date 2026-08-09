<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Commands

| Command | Purpose |
|---|---|
| `npm run dev` | local dev server (default :3000) |
| `npm run build` | production build |
| `npm run lint` | eslint (use `--max-warnings 0` in CI) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:run` | unit tests (Vitest, no watch) |
| `npm run test:ui` | unit tests with UI runner |
| `npm run test:e2e` | E2E (Playwright) — uses port 3100 |
| `npm run test:e2e:codegen` | record a new E2E test |

# Deploy

- Repo conectado a GitHub: `github.com/aleurizar/mapainversor`
- Vercel: conectar el repo desde vercel.com → Next.js se detecta automáticamente.
- Variables de entorno requeridas (configurar en Vercel + GitHub Secrets):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`.
- CI en GitHub Actions (`.github/workflows/ci.yml`): lint, typecheck, unit tests, E2E.
