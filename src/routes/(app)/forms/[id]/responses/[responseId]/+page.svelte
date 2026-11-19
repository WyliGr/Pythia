<script lang="ts">
  import { t } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const r = $derived(data.response);

  function cell(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join('; ');
    return String(value);
  }
</script>

<svelte:head><title>{t.responses.title} · {data.form.title}</title></svelte:head>

<div class="container">
  <div class="stack">
    <p class="muted small" style="margin: 0;">
      <a href="/forms/{data.form.id}/responses">← {t.responses.back}</a>
    </p>
    <h1 style="margin: 0;">{data.form.title}</h1>
    <p class="muted small">{r.submittedAt.toLocaleString()}</p>

    <div class="card stack" style="gap: 12px;">
      {#each r.snapshot as snap (snap.id)}
        <div>
          <div class="small muted" style="font-weight: 600;">{snap.label}</div>
          <div style="white-space: pre-wrap;">{cell(r.answers[snap.id])}</div>
        </div>
      {/each}
    </div>
  </div>
</div>
