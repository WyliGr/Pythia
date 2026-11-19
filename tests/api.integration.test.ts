/**
 * Live integration tests against a running Pythia instance.
 * Enable with: PYTHIA_BASE=http://localhost:3000 npx vitest run tests/api.integration.test.ts
 */
import { describe, expect, it } from 'vitest';

const BASE = process.env.PYTHIA_BASE;
const run = BASE ? describe : describe.skip;

class CookieJar {
  readonly store = new Map<string, string>();
  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function req(path: string, opts: RequestInit & { jar?: CookieJar } = {}): Promise<Response> {
  const headers = new Headers(opts.headers as HeadersInit);
  // SvelteKit form actions enforce Origin; browsers send it automatically, fetch does not.
  if (opts.method === 'POST' && !headers.has('origin')) headers.set('origin', BASE!);
  if (opts.jar?.header()) headers.set('cookie', opts.jar.header());
  if (opts.body && typeof opts.body === 'string' && !headers.has('content-type')) {
    headers.set('content-type', 'application/x-www-form-urlencoded');
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers, redirect: 'manual' });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) opts.jar?.store.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  // SvelteKit form actions answer fetch clients with JSON redirects — follow them.
  if ((res.headers.get('content-type') ?? '').includes('application/json')) {
    const clone = res.clone();
    try {
      const body = await clone.json();
      if (body?.type === 'redirect' && body.location) {
        return req(body.location, { jar: opts.jar, method: 'GET' });
      }
      // Action failure/success envelopes arrive with HTTP 200; surface the real status.
      if (body?.type === 'failure' || body?.type === 'success') {
        return new Response(JSON.stringify(body), {
          status: body.status ?? 200,
          headers: { 'content-type': 'application/json' }
        });
      }
    } catch {
      // not an action payload
    }
  }
  return res;
}

async function signup(j: CookieJar, email: string): Promise<Response> {
  return req('/signup', { method: 'POST', jar: j, body: `email=${email}&password=password123&name=Test` });
}

run('live instance', () => {
  const ts = Date.now();
  const jarA = new CookieJar();
  const jarB = new CookieJar();
  let formId = '';
  let slug = '';
  let formsWriteKey = '';
  let responsesReadKey = '';

  it('first signup becomes admin, second is regular', async () => {
    const a = await signup(jarA, `a${ts}@test.dev`);
    expect(a.status).toBe(200); // followed JSON redirect to /forms
    const adminRes = await req('/admin', { jar: jarA });
    expect(adminRes.status).toBe(200);

    const b = await signup(jarB, `b${ts}@test.dev`);
    expect(b.status).toBe(200);
    const forbidden = await req('/admin', { jar: jarB });
    expect(forbidden.status).toBe(403);
  });

  it('owner can create a form via UI; public page renders', async () => {
    slug = `it-${ts}`;
    const create = await req('/forms?/create', { method: 'POST', jar: jarA, body: '' });
    expect(create.status).toBe(200); // followed redirect to /forms/<id>/edit
    formId = new URL(create.url).pathname.split('/')[2];
    expect(formId).toMatch(/^[0-9a-f-]{36}$/);
    const save = await req(`/forms/${formId}/edit?/save`, {
      method: 'POST',
      jar: jarA,
      body: new URLSearchParams({
        title: 'Integration form',
        description: 'd',
        slug,
        open: 'on',
        closeDate: '',
        webhookUrl: '',
        webhookSecret: '',
        questions: JSON.stringify([
          { id: 'q1', type: 'short_text', label: 'Name', required: true },
          { id: 'q2', type: 'email', label: 'Email', required: true }
        ])
      }).toString()
    });
    expect(save.status).toBe(200);
    const pub = await req(`/f/${slug}`);
    expect(pub.status).toBe(200);
    expect(await pub.text()).toContain('Integration form');
  });

  it('other account cannot edit or export that form', async () => {
    const edit = await req(`/forms/${formId}/edit`, { jar: jarB });
    expect(edit.status).toBe(404);
    const csv = await req(`/forms/${formId}/export.csv`, { jar: jarB });
    expect(csv.status).toBe(404);
  });

  it('anonymous submission validates then succeeds; CSV matches', async () => {
    const bad = await req(`/f/${slug}`, { method: 'POST', body: 'q1=No+Email' });
    expect(bad.status).toBe(400);
    const good = await req(`/f/${slug}`, {
      method: 'POST',
      body: new URLSearchParams({ q1: 'Ada Lovelace', q2: 'ada@lovelace.dev' }).toString()
    });
    expect(good.status).toBe(200);
    const csv = await req(`/forms/${formId}/export.csv`, { jar: jarA });
    expect(csv.headers.get('content-type')).toContain('text/csv');
    const text = await csv.text();
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada@lovelace.dev');
  });

  it('scope enforcement: responses:read key gets 403 on write, 200 on responses', async () => {
    // Create keys through the REST of the site UI actions.
    const rr = await createKeyViaUi(jarA, ['responses:read']);
    const fw = await createKeyViaUi(jarA, ['forms:write']);
    responsesReadKey = rr;
    formsWriteKey = fw;
    expect(rr).toMatch(/^pk_/);
    expect(fw).toMatch(/^pk_/);

    const listDenied = await fetch(`${BASE}/api/v1/forms`, {
      headers: { authorization: `Bearer ${responsesReadKey}` }
    });
    expect(listDenied.status).toBe(403);

    const createDenied = await fetch(`${BASE}/api/v1/forms`, {
      method: 'POST',
      headers: { authorization: `Bearer ${responsesReadKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'nope', slug: `nope-${ts}` })
    });
    expect(createDenied.status).toBe(403);

    const responsesOk = await fetch(`${BASE}/api/v1/forms/${formId}/responses`, {
      headers: { authorization: `Bearer ${responsesReadKey}` }
    });
    expect(responsesOk.status).toBe(200);
    const data = await responsesOk.json();
    expect(data.responses.length).toBeGreaterThan(0);

    const listWithWriteScope = await fetch(`${BASE}/api/v1/forms`, {
      headers: { authorization: `Bearer ${formsWriteKey}` }
    });
    expect(listWithWriteScope.status).toBe(403); // write-only key cannot read
  });

  it('REST create + update roundtrip with a forms:write key', async () => {
    const created = await fetch(`${BASE}/api/v1/forms`, {
      method: 'POST',
      headers: { authorization: `Bearer ${formsWriteKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'API form',
        slug: `api-${ts}`,
        questions: [{ id: 'q1', type: 'short_text', label: 'Name', required: true }]
      })
    });
    expect(created.status).toBe(201);
    const { form } = await created.json();

    const patched = await fetch(`${BASE}/api/v1/forms/${form.id}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${formsWriteKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'API form v2', open: false })
    });
    expect(patched.status).toBe(200);
    const { form: updated } = await patched.json();
    expect(updated.title).toBe('API form v2');
    expect(updated.open).toBe(false);

    // Closed form rejects anonymous submissions.
    const submit = await fetch(`${BASE}/f/api-${ts}`, { method: 'POST', body: 'q1=x' });
    expect([403, 404, 400]).toContain(submit.status);
  });

  it('MCP get_responses returns real data', async () => {
    const mcpRes = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${responsesReadKey}`,
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'get_responses', arguments: { formId } }
      })
    });
    expect(mcpRes.status).toBe(200);
    const body = await mcpRes.text();
    expect(body).toContain('Ada Lovelace');
  });

  it('delete-everything removes the account and its data', async () => {
    const del = await req('/settings?/deleteAccount', { method: 'POST', jar: jarB, body: '' });
    expect(del.status).toBe(200); // followed JSON redirect to /login
    const gone = await req('/forms', { jar: jarB });
    expect(gone.url).toContain('/login');
  });

  it('openapi spec is published', async () => {
    const spec = await req('/api/openapi.json');
    expect(spec.status).toBe(200);
    const json = await spec.json();
    expect(json.paths['/forms']).toBeDefined();
  });
});

/** Creates a key via the settings page action and scrapes it from the response HTML. */
async function createKeyViaUi(j: CookieJar, scopes: string[]): Promise<string> {
  const params = new URLSearchParams({ keyName: `k-${Math.random().toString(36).slice(2)}` });
  for (const s of scopes) params.append('scopes', s);
  const res = await req('/settings?/createKey', { method: 'POST', jar: j, body: params.toString() });
  const text = await res.text();
  const match = text.match(/pk_[a-f0-9]{48}/);
  if (!match) throw new Error(`key not found in response: ${text.slice(0, 300)}`);
  return match[0];
}
