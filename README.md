# Pythia

A lightweight, FOSS, self-hosted alternative to Google Forms. Create an account, build forms in a clean builder, share a public link, collect responses, export them. AI agents work through a REST API and a built-in MCP server using scoped API keys.

## Quickstart (5 minutes)

```bash
git clone <this-repo> pythia && cd pythia
cp .env.example .env
docker compose up -d
```

Open the URL in `PUBLIC_URL` (default <http://localhost:3000>). The **first account you create becomes the server admin**; later signups are regular accounts.

That's it — one compose file, two services (app + Postgres), named volume for data, healthchecks and restart policies included.

## Why this stack

SvelteKit (Node adapter) + Postgres + Drizzle ORM, everything in one app image with the MCP server mounted as a route (`/mcp`) using the stateless Streamable HTTP transport. SvelteKit gives server-rendered pages, form actions, and API endpoints in one framework — so the public form stays fast on a phone without shipping a heavy client bundle. Postgres is the boring, correct choice for multi-account relational data; Drizzle keeps the schema type-checked with near-zero runtime weight. The runtime image only carries production deps plus Drizzle's SQL migrations, which run automatically at container start. Total: two containers, one volume, no build steps required from the operator beyond `docker compose up`.

## Features

- **Form builder** — add / edit / reorder / duplicate / delete questions. Types: short text, long text, single choice, multi-select, dropdown, rating, date, email, number. Required toggles, placeholders, help text. Custom public slug, open/closed toggle, optional close date.
- **Public forms** — anonymous submission at `PUBLIC_URL/f/<slug>`, client + server validation, thank-you state, closed forms are disabled. Owner branding (accent color, logo) applied automatically.
- **Responses** — per-form table, individual answer view, CSV and JSON export. Responses store a snapshot of the questions at submission time, so exports keep correct columns even after you edit a form.
- **Accounts** — multi-account, ownership enforced server-side everywhere. First signup = admin with an admin panel (user management, branding defaults, usage overview).
- **Branding** — per-account accent color and logo, instance-wide defaults for new accounts set by the admin.
- **Theme** — dark/light toggle, persisted per device, respects system preference by default.
- **Webhooks** — optional per-form webhook on each submission (HMAC-signed, 2 retries).
- **i18n-ready** — all UI copy lives in `src/lib/i18n/en.ts`; add a sibling file to translate.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PUBLIC_URL` | `http://localhost:3000` | Public base URL. Used for share links. Must match how users reach the instance. |
| `APP_PORT` | `3000` | Host port the app is published on. |
| `POSTGRES_USER` | `pythia` | Database user (only change together with the others). |
| `POSTGRES_PASSWORD` | `pythia` | Database password. **Change in production.** |
| `POSTGRES_DB` | `pythia` | Database name. |
| `DATABASE_URL` | composed from the above | Full Postgres URL; set directly only for an external database. |

## REST API

Versioned under `/api/v1`. Auth: personal API keys created in **Settings → API keys**, sent as `Authorization: Bearer pk_…`. Scopes are chosen at creation: `forms:read`, `forms:write`, `responses:read`. Full reference published at [`/api/openapi.json`](http://localhost:3000/api/openapi.json).

```bash
export PYTHIA_KEY=pk_…

# List forms (needs forms:read)
curl -s -H "Authorization: Bearer $PYTHIA_KEY" http://localhost:3000/api/v1/forms

# Create a form (needs forms:write)
curl -s -X POST -H "Authorization: Bearer $PYTHIA_KEY" -H "content-type: application/json" \
  http://localhost:3000/api/v1/forms \
  -d '{
    "title": "Customer feedback",
    "slug": "customer-feedback",
    "questions": [
      { "id": "q1", "type": "short_text", "label": "Name", "required": true },
      { "id": "q2", "type": "rating", "label": "How are we doing?", "required": true, "maxRating": 5 },
      { "id": "q3", "type": "long_text", "label": "Anything else?", "required": false }
    ]
  }'

# Update (needs forms:write) — PATCH only changes provided fields
curl -s -X PATCH -H "Authorization: Bearer $PYTHIA_KEY" -H "content-type: application/json" \
  http://localhost:3000/api/v1/forms/<form-id> -d '{ "open": false }'

# Responses (needs responses:read)
curl -s -H "Authorization: Bearer $PYTHIA_KEY" http://localhost:3000/api/v1/forms/<form-id>/responses
```

Errors are JSON (`{ "error": "…" }`): `401` no/invalid key, `403` missing scope, `404` not found / not owned, `409` slug conflict.

## MCP server

The app image ships a stateless MCP server (Streamable HTTP) at `POST /mcp`. Tools: `list_forms`, `create_form`, `update_form`, `get_responses` — each enforces the same scopes and ownership as the REST API.

Claude Code / compatible client config:

```json
{
  "mcpServers": {
    "pythia": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": { "Authorization": "Bearer pk_…" }
    }
  }
}
```

MCP inspector quick check:

```bash
npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp \
  --transport http --header "Authorization: Bearer pk_…" --method tools/list
```

## Webhooks

Per form (builder → Webhook): on each submission Pythia POSTs

```json
{ "event": "response.created", "formId": "…", "responseId": "…", "submittedAt": "…", "answers": { "…": "…" } }
```

If a secret is set, the body is signed: `X-Pythia-Signature: <hmac-sha256 hex>`. Two retries on failure.

## Development

```bash
npm install
docker compose up -d db            # just the database
DATABASE_URL=postgres://pythia:pythia@localhost:5432/pythia npx drizzle-kit push
npm run dev
```

| Command | What |
|---|---|
| `npm run check` | Typecheck (svelte-check) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `PYTHIA_BASE=http://localhost:3000 npx vitest run tests/api.integration.test.ts` | Live end-to-end suite against a running instance |

## Project layout

```
src/routes/            pages + endpoints
  (app)/               authenticated shell: forms, settings, admin
  f/[slug]/            public form
  api/v1/…             REST API
  mcp/                 MCP server endpoint
src/lib/server/        db, auth, api keys, validation, csv, forms, mcp
src/lib/i18n/          all user-facing strings
drizzle/               SQL migrations (applied on container start)
```

## License

Apache-2.0. See [LICENSE](LICENSE).
