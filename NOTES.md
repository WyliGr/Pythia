# NOTES

## Built (P0) + verified end-to-end on a fresh `docker compose up`

- Full lifecycle: first-user admin signup → create form → submit anonymously → export CSV/JSON → scoped API keys → REST API → MCP `get_responses` (automated in `tests/api.integration.test.ts`, 8/8 passing).
- Unit tests for validation, CSV/export stability, password hashing, scopes. Typecheck and lint clean.

## P1 included

- Per-form webhook on submission (HMAC-SHA-256 signature, 2 retries).
- RGPD "delete everything" button in Settings (account + forms + responses + keys, with confirmation).

## P1 not included

- Email notification on submission — needs an SMTP dependency and per-account or per-form settings; sized as a v2 task rather than bolted on.
- Response charts (aggregates) — requires a charting decision (client-side, dependency-free) that wasn't worth rushing; the data is already one JSON call away.
- Per-answer validation rules (min/max, regex) — data model supports it later per-question.

## Deliberate choices

- Responses store a **question snapshot** at submission time; exports union the snapshots, so columns stay correct after edits (tested).
- MCP endpoint is **stateless** (`sessionIdGenerator: undefined`, one server instance per POST) — horizontally scalable, no session store.
- SvelteKit form actions return JSON envelopes (`{"type":"failure","status":…}`) to non-JS POST clients; plain browsers get normal redirects. The integration suite unwraps this.
- CSRF: SvelteKit enforces Origin on form posts; `PUBLIC_URL`/`ORIGIN` must match how the instance is reached.
- Builder question reorder uses up/down buttons instead of drag-and-drop: accessible, works on mobile, zero dependencies.
