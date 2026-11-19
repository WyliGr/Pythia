# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security reports. Email the maintainer (see repository owner profile) with:

- a description of the issue and its impact,
- steps to reproduce on a fresh `docker compose up` install,
- affected version/commit.

You will get an acknowledgement within 72 hours. We aim to ship a fix or a documented mitigation within 14 days for high-severity issues.

## What not to expose

When self-hosting Pythia:

- **API keys** (`pk_…`) grant REST/MCP access with their scopes. Never commit them, share them, or paste them into screenshots. Revoke and rotate any leaked key from Settings.
- **The admin panel** (`/admin`) is only reachable by the first-registered account (and accounts it promotes). Do not publish admin credentials in support tickets or forums.
- **`POSTGRES_PASSWORD`** — change it from the example value before exposing the instance to a network.
- Instance data lives in the named Docker volume; back it up and restrict host access accordingly.

## Hardening notes

- Serve behind HTTPS (reverse proxy such as Caddy/Traefik/nginx) and set `PUBLIC_URL` to the https URL so form-post CSRF origin checks work with your domain.
- Sessions are 30-day httpOnly cookies; API keys are stored as SHA-256 hashes and shown once.
- Webhook deliveries are signed with HMAC-SHA-256 when a secret is configured — verify `X-Pythia-Signature` on receipt.
