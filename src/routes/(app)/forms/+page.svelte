<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let copiedId = $state<string | null>(null);

  function copyLink(id: string, slug: string) {
    const url = `${data.publicUrl || location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    copiedId = id;
    setTimeout(() => (copiedId = null), 1500);
  }
</script>

<svelte:head><title>{t.dashboard.title} · {t.app.name}</title></svelte:head>

<div class="container wide">
  <div class="row between" style="margin-bottom: 20px;">
    <h1 style="margin: 0;">{t.dashboard.title}</h1>
    <form method="POST" action="?/create">
      <button class="btn primary" type="submit">+ {t.dashboard.newForm}</button>
    </form>
  </div>

  {#if form && 'error' in form}
    <p class="alert error">{form.error}</p>
  {/if}

  {#if data.forms.length === 0}
    <div class="card muted" style="text-align: center; padding: 60px 20px;">{t.dashboard.empty}</div>
  {:else}
    <div class="card" style="padding: 0; overflow-x: auto;">
      <table class="table">
        <thead>
          <tr>
            <th>{t.builder.formTitle}</th>
            <th>Status</th>
            <th>{t.responses.title}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.forms as f (f.id)}
            <tr>
              <td>
                <a href="/forms/{f.id}/edit" style="color: var(--text); font-weight: 600;">{f.title}</a>
                <div class="muted small">/f/{f.slug}</div>
              </td>
              <td>
                <span class="badge" class:accent={f.open}>{f.open ? t.dashboard.open : t.dashboard.closed}</span>
              </td>
              <td>{f.responseCount}</td>
              <td style="white-space: nowrap; text-align: right;">
                <button class="btn small" onclick={() => copyLink(f.id, f.slug)}>
                  {copiedId === f.id ? t.dashboard.copied : t.dashboard.shareLink}
                </button>
                <a class="btn small" href="/f/{f.slug}" target="_blank">↗</a>
                <a class="btn small" href="/forms/{f.id}/responses">{t.responses.title}</a>
                <form
                  method="POST"
                  action="?/delete"
                  style="display: inline;"
                  use:enhance={({ cancel }) => {
                    if (!confirm(t.dashboard.deleteConfirm)) cancel();
                  }}
                >
                  <input type="hidden" name="id" value={f.id} />
                  <button class="btn small danger" type="submit">{t.dashboard.deleteForm}</button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
