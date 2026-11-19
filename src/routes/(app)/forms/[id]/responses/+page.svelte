<script lang="ts">
  import { t } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function cell(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.join('; ');
    return String(value);
  }
</script>

<svelte:head><title>{t.responses.title} · {data.form.title}</title></svelte:head>

<div class="container wide">
  <div class="row between wrap" style="margin-bottom: 20px;">
    <div>
      <h1 style="margin: 0;">{t.responses.title}</h1>
      <p class="muted small" style="margin: 4px 0 0;">
        <a href="/forms/{data.form.id}/edit">← {data.form.title}</a> · {data.rows.length}
        {data.rows.length === 1 ? t.responses.responseOne : t.responses.responseMany}
      </p>
    </div>
    <div class="row">
      <a class="btn" href="/forms/{data.form.id}/export.csv" download>{t.responses.exportCsv}</a>
      <a class="btn" href="/forms/{data.form.id}/export.json" download>{t.responses.exportJson}</a>
    </div>
  </div>

  {#if data.rows.length === 0}
    <div class="card muted" style="text-align: center; padding: 60px 20px;">{t.responses.empty}</div>
  {:else}
    <div class="card" style="padding: 0; overflow-x: auto;">
      <table class="table">
        <thead>
          <tr>
            <th>{t.responses.submittedAt}</th>
            {#each data.columns as col (col.id)}
              <th>{col.label}</th>
            {/each}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.rows as row (row.id)}
            <tr>
              <td style="white-space: nowrap;">{new Date(row.submittedAt).toLocaleString()}</td>
              {#each data.columns as col (col.id)}
                <td style="max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {cell(row.answers[col.id])}
                </td>
              {/each}
              <td><a class="btn small" href="/forms/{data.form.id}/responses/{row.id}">{t.responses.view}</a></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
