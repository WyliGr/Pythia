<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let copied = $state(false);
  let copiedCfg = $state(false);
  let copiedPrompt = $state(false);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function copyText(text: string, which: 'cfg' | 'prompt') {
    navigator.clipboard.writeText(text);
    if (which === 'cfg') {
      copiedCfg = true;
      setTimeout(() => (copiedCfg = false), 1500);
    } else {
      copiedPrompt = true;
      setTimeout(() => (copiedPrompt = false), 1500);
    }
  }

  const mcpUrl = $derived(`${data.publicUrl}/mcp`);
  const agentConfig = $derived(
    JSON.stringify(
      {
        mcpServers: {
          pythia: {
            type: 'http',
            url: mcpUrl,
            headers: { Authorization: 'Bearer pk_your_key_here' }
          }
        }
      },
      null,
      2
    )
  );
  const agentPrompt = $derived(`You have access to my self-hosted Pythia forms server through its MCP endpoint (Streamable HTTP).

Connect to: ${mcpUrl}
Authenticate every request with the header: Authorization: Bearer pk_your_key_here

Available tools: list_forms, create_form, update_form, get_responses. Use them to list my forms, create or update forms from my prompts, and pull responses. These tools enforce ownership and scopes; if a call fails with an auth or scope error, tell me so I can fix the API key.`);
</script>

<svelte:head><title>{t.settings.title} · {t.app.name}</title></svelte:head>

<div class="container">
  <h1>{t.settings.title}</h1>

  <div class="stack">
    <form method="POST" action="?/saveProfile" class="card stack">
      <h2>{t.settings.profile}</h2>
      {#if form?.savedProfile}<p class="alert info">{t.settings.saved}</p>{/if}
      <label class="field">
        {t.settings.nameLabel}
        <input type="text" name="name" value={data.user.name} />
      </label>
      <div><button class="btn primary" type="submit">{t.settings.save}</button></div>
    </form>

    <div class="card stack">
      <h2>{t.settings.apiKeys}</h2>
      <p class="muted small" style="margin: 0;">{t.settings.apiKeysHint}</p>

      {#if form?.newKey}
        <div class="alert info">
          <div style="font-weight: 600; margin-bottom: 6px;">{t.settings.keyCreated}</div>
          <code class="token">{form.newKey}</code>
          <button class="btn small" style="margin-left: 8px;" onclick={() => copyKey(form!.newKey!)}>
            {copied ? t.dashboard.copied : t.settings.copyKey}
          </button>
        </div>
      {/if}

      {#if data.keys.length > 0}
        <table class="table">
          <thead>
            <tr><th>{t.settings.keyName}</th><th>Key</th><th>{t.settings.keyScopes}</th><th>{t.settings.lastUsed}</th><th></th></tr>
          </thead>
          <tbody>
            {#each data.keys as k (k.id)}
              <tr>
                <td>{k.name}</td>
                <td><code class="token">{k.prefix}…</code></td>
                <td class="small">{k.scopes.join(', ')}</td>
                <td class="small muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : t.settings.neverUsed}</td>
                <td>
                  <form method="POST" action="?/revokeKey">
                    <input type="hidden" name="id" value={k.id} />
                    <button class="btn small danger" type="submit">{t.settings.revoke}</button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}

      <form method="POST" action="?/createKey" class="row wrap" style="align-items: flex-end;">
        {#if form?.error && form?.key}<p class="alert error" style="width: 100%;">{form.error}</p>{/if}
        <label class="field" style="min-width: 160px;">
          {t.settings.keyName}
          <input type="text" name="keyName" required placeholder="my-agent" />
        </label>
        <div class="field">
          {t.settings.keyScopes}
          <div class="row">
            {#each data.scopes as scope (scope)}
              <label class="row small" style="gap: 4px; font-weight: 400;">
                <input type="checkbox" name="scopes" value={scope} style="width: auto;" checked={scope !== 'forms:write'} />
                {scope}
              </label>
            {/each}
          </div>
        </div>
        <button class="btn primary" type="submit">{t.settings.newKey}</button>
      </form>
    </div>

    <div class="card stack">
      <h2>{t.settings.agentTitle}</h2>
      <p class="muted small" style="margin: 0;">{t.settings.agentHint}</p>

      <div class="field">
        <span class="row between">
          <span>{t.settings.agentConfig}</span>
          <button class="btn small" type="button" onclick={() => copyText(agentConfig, 'cfg')}>
            {copiedCfg ? t.dashboard.copied : t.settings.copyKey}
          </button>
        </span>
        <pre class="codeblock">{agentConfig}</pre>
      </div>

      <div class="field">
        <span class="row between">
          <span>{t.settings.agentPrompt}</span>
          <button class="btn small" type="button" onclick={() => copyText(agentPrompt, 'prompt')}>
            {copiedPrompt ? t.dashboard.copied : t.settings.copyKey}
          </button>
        </span>
        <pre class="codeblock" style="white-space: pre-wrap;">{agentPrompt}</pre>
      </div>
      <p class="hint" style="margin: 0;">{t.settings.agentKeyHint}</p>
    </div>

    {#if data.admin}
      <section id="admin" class="stack" aria-label={t.admin.title}>
        <h1>{t.admin.title}</h1>

        <div class="row wrap" style="gap: 12px;">
          <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700;">{data.admin.totals.users}</div>
            <div class="muted small">{t.admin.totalUsers}</div>
          </div>
          <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700;">{data.admin.totals.forms}</div>
            <div class="muted small">{t.admin.totalForms}</div>
          </div>
          <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700;">{data.admin.totals.responses}</div>
            <div class="muted small">{t.admin.totalResponses}</div>
          </div>
        </div>

        <div class="card stack">
          <h2>{t.admin.users}</h2>
          <div style="overflow-x: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th>{t.admin.email}</th><th>{t.admin.role}</th><th>{t.admin.formsCount}</th>
                  <th>{t.admin.responsesCount}</th><th>{t.admin.joined}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {#each data.admin.users as u (u.id)}
                  <tr>
                    <td>{u.email}{#if u.name} <span class="muted">· {u.name}</span>{/if}</td>
                    <td><span class="badge" class:accent={u.isAdmin}>{u.isAdmin ? t.admin.adminRole : t.admin.userRole}</span></td>
                    <td>{u.formsCount}</td>
                    <td>{u.responsesCount}</td>
                    <td class="small muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style="white-space: nowrap; text-align: right;">
                      {#if u.id !== data.user.id}
                        <form method="POST" action="?/toggleAdmin" style="display: inline;">
                          <input type="hidden" name="id" value={u.id} />
                          <button class="btn small" type="submit">{u.isAdmin ? t.admin.revokeAdmin : t.admin.makeAdmin}</button>
                        </form>
                        <form
                          method="POST"
                          action="?/deleteUser"
                          style="display: inline;"
                          use:enhance={({ cancel }) => {
                            if (!confirm(t.admin.deleteUserConfirm)) cancel();
                          }}
                        >
                          <input type="hidden" name="id" value={u.id} />
                          <button class="btn small danger" type="submit">{t.admin.deleteUser}</button>
                        </form>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <form method="POST" action="?/saveDefaults" class="card stack">
          <h2>{t.admin.defaults}</h2>
          <p class="muted small" style="margin: 0;">{t.admin.defaultsHint}</p>
          {#if form?.savedDefaults}<p class="alert info">{t.admin.saved}</p>{/if}
          {#if form?.error && form?.admin}<p class="alert error">{form.error}</p>{/if}
          <div class="row wrap">
            <label class="field" style="width: 140px;">
              {t.settings.accentColor}
              <input type="color" name="defaultAccentColor" value={data.admin.defaults?.defaultAccentColor ?? '#3d63dd'} style="height: 40px; padding: 3px;" />
            </label>
            <label class="field" style="flex: 1; min-width: 220px;">
              {t.settings.logoUrl}
              <input type="url" name="defaultLogoUrl" value={data.admin.defaults?.defaultLogoUrl ?? ''} placeholder="https://example.com/logo.svg" />
            </label>
          </div>
          <div><button class="btn primary" type="submit">{t.admin.save}</button></div>
        </form>
      </section>
    {/if}

    <div class="card stack">
      <h2>{t.settings.dangerZone}</h2>
      <p class="muted small" style="margin: 0;">{t.settings.deleteAccountHint}</p>
      <div>
        <form
          method="POST"
          action="?/deleteAccount"
          use:enhance={({ cancel }) => {
            if (!confirm(t.settings.deleteAccountConfirm)) cancel();
          }}
        >
          <button class="btn danger" type="submit">{t.settings.deleteAccount}</button>
        </form>
      </div>
    </div>
  </div>
</div>
