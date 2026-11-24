# cv.eggisatria.my.id

Public CV, ATS-friendly PDF and an MCP endpoint for agents. Content lives in the
shared Supabase database (`cv_versions`) and is edited in the manager at
`/dashboard/cv` (CV Studio).

| Route | What it serves |
|---|---|
| `/` | The primary CV as a web page |
| `/pdf` (`?download` for a file) | The primary CV as a one-column, text-based PDF |
| `/v/<slug>`, `/v/<slug>/pdf` | A public tailored version (noindex) |
| `/api/mcp` | MCP over Streamable HTTP, Bearer API key |
| `/api/revalidate` | Called by the manager after a save |

Shared logic is in `packages/cv` (`@ecosystem/cv-core`): schema, ATS check,
PDF layout, the store both the manager and MCP write through, the brain client
and the AI fact guard.

## Deploy (Vercel)

1. New Vercel project from this repo, root directory `apps/cv`, framework Next.js.
   Install and build use the monorepo defaults (`pnpm install`, `next build`).
2. Domain: add `cv.eggisatria.my.id` to the project, then a DNS `CNAME cv -> cname.vercel-dns.com`.
3. Environment variables (Production):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL`, `DIRECT_URL` | Same as the other apps |
   | `NEXT_PUBLIC_CV_URL` | `https://cv.eggisatria.my.id` |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.eggisatria.my.id` |
   | `REVALIDATE_SECRET` | Same value as the other apps |
   | `BRAIN_MCP_URL` | `https://brain.eggisatria.my.id/api/mcp` |
   | `BRAIN_MCP_TOKEN` | A dedicated brain token (below) |
   | `BRAIN_APPLICATIONS_FOLDER` | Optional, default `03-Areas/Career-Applications/` |

   Do not set `CV_MCP_DEV_TOKEN` on Vercel. It only works under `next dev`.

4. Manager project, add: `NEXT_PUBLIC_CV_URL`, `BRAIN_MCP_URL`, `BRAIN_MCP_TOKEN`,
   `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, default `gemini-2.5-flash`).
   The manager then refreshes the CV site after every save.
5. Brain token, on the brain VPS, limited to the applications folder:
   `npm run token -- cv --prefixes 03-Areas/Career-Applications/`
   Searching and reading other notes still needs read access to them; widen the
   prefixes only if the token model separates read from write.
6. MCP key: in the manager, API Keys, create a key whose name starts with `cv`
   (for example `cv claude`). Keys with other names are refused by `/api/mcp`.
7. After the first deploy, set the website's resume link (manager, Settings,
   `resumeUrl`) to `https://cv.eggisatria.my.id/pdf`.

## Connect an agent

```json
{
  "mcpServers": {
    "cv": {
      "type": "http",
      "url": "https://cv.eggisatria.my.id/api/mcp",
      "headers": { "Authorization": "Bearer <cv key>" }
    }
  }
}
```

Tools: `cv_list_versions`, `cv_get`, `cv_profile_data`, `cv_ats_check`,
`cv_create_version`, `cv_update_version` (needs `expectedUpdatedAt`),
`cv_brain_search`, `cv_log_application`.

Job tracker tools (same data as the manager's `/dashboard/applications`):
`job_list_applications`, `job_get_application` (contacts and salary only with
`includePrivate`), `job_create_application` (`createCv` makes the tailored
version in the same call), `job_update_application`, `job_move_stage`,
`job_add_event`, `job_attach_cv`. Every stage change is added to the
application's brain note (`03-Areas/Career-Applications/`) after the call
returns: company, role, stage, source, job link, CV link and ATS score, never
contacts, salary or the job description.

## Local

```
pnpm --filter @ecosystem/cv dev        # http://localhost:3004
pnpm --filter @ecosystem/cv seed <file.json>
pnpm --filter @ecosystem/cv-core test
```

Schema changes: `packages/database/prisma/sql/2026-11-24_add_cv_versions.sql` and
`2026-11-24_add_job_applications.sql` (both already applied). Do not run `prisma db push` on this database; it would also
apply unrelated drift.
