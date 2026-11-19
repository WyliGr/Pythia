<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let copied = $state(false);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<svelte:head><title>{t.settings.title} · {t.app.name}</title></svelte:head>

<div class="container">
  <h1>{t.settings.title}</h1>

  <div class="stack">
    <form method="POST" action="?/saveProfile" class="card stack">
      <h2>{t.settings.profile}</h2>
      {#if form?.error && form?.profile}<p class="alert error">{form.error}</p>{/if}
      {#if form?.savedProfile}<p class="alert info">{t.settings.saved}</p>{/if}
      <label class="field">
        {t.settings.nameLabel}
        <input type="text" name="name" value={data.user.name} />
      </label>

      <h2 style="margin-top: 8px;">{t.settings.branding}</h2>
      <p class="muted small" style="margin: 0;">{t.settings.brandingHint}</p>
      <div class="row wrap">
        <label class="field" style="width: 140px;">
          {t.settings.accentColor}
          <input type="color" name="accentColor" value={data.user.accentColor ?? '#3d63dd'} style="height: 40px; padding: 3px;" />
        </label>
        <label class="field" style="flex: 1; min-width: 220px;">
          {t.settings.logoUrl}
          <input type="url" name="logoUrl" value={data.user.logoUrl ?? ''} placeholder="https://example.com/logo.svg" />
        </label>
      </div>
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
