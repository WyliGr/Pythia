<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import type { Question } from '$lib/questions';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const accentStyle = $derived(data.owner.accentColor ? `--accent: ${data.owner.accentColor}` : '');

  function prev(q: Question, submitted: Record<string, unknown> | undefined): unknown {
    return submitted?.[q.id];
  }
</script>

<svelte:head>
  <title>{data.form.title}</title>
  <meta name="description" content={data.form.description} />
</svelte:head>

<div style={accentStyle}>
  <div class="public-wrap">
    {#if data.owner.logoUrl}
      <img src={data.owner.logoUrl} alt="" style="height: 40px; margin-bottom: 24px; border-radius: 6px;" />
    {/if}

    {#if !data.form.open}
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <h1 style="font-size: 1.4rem;">{t.publicForm.closed}</h1>
        <p class="muted">{t.publicForm.closedBody}</p>
      </div>
    {:else if form?.submitted}
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 6-6"/></svg>
        <h1 style="font-size: 1.4rem;">{t.publicForm.thankYou}</h1>
        <p class="muted">{t.publicForm.thankYouBody}</p>
      </div>
    {:else}
      <h1 class="public-title">{data.form.title}</h1>
      {#if data.form.description}
        <p class="muted" style="white-space: pre-wrap; margin-bottom: 28px;">{data.form.description}</p>
      {/if}

      {#if form?.error}
        <p class="alert error">{form.error}</p>
      {/if}

      <form method="POST" use:enhance class="stack" style="margin-top: 8px;">
        {#each data.form.questions as q (q.id)}
          <label class="field" style="font-size: 0.95rem;">
            <span>
              {q.label}
              {#if q.required}<span style="color: var(--accent);"> {t.publicForm.requiredMark}</span>{/if}
            </span>
            {#if q.helpText}<span class="hint">{q.helpText}</span>{/if}

            {#if q.type === 'short_text'}
              <input type="text" name={q.id} placeholder={q.placeholder} required={q.required} value={String(prev(q, form?.values) ?? '')} />
            {:else if q.type === 'long_text'}
              <textarea name={q.id} placeholder={q.placeholder} required={q.required}>{String(prev(q, form?.values) ?? '')}</textarea>
            {:else if q.type === 'email'}
              <input type="email" name={q.id} placeholder={q.placeholder ?? 'you@example.com'} required={q.required} value={String(prev(q, form?.values) ?? '')} />
            {:else if q.type === 'number'}
              <input type="number" name={q.id} placeholder={q.placeholder} required={q.required} value={String(prev(q, form?.values) ?? '')} />
            {:else if q.type === 'date'}
              <input type="date" name={q.id} required={q.required} value={String(prev(q, form?.values) ?? '')} />
            {:else if q.type === 'rating'}
              <div class="row" style="gap: 6px;">
                {#each Array.from({ length: q.maxRating ?? 5 }, (_, i) => i + 1) as n (n)}
                  <label class="btn small" style="cursor: pointer;">
                    <input type="radio" name={q.id} value={n} required={q.required} checked={prev(q, form?.values) === String(n)} style="position: absolute; opacity: 0; width: 0;" />
                    {n}
                  </label>
                {/each}
              </div>
            {:else if q.type === 'single_choice'}
              <div class="stack" style="gap: 8px;">
                {#each q.options ?? [] as opt, oi (oi)}
                  <label class="row" style="gap: 8px; font-weight: 400;">
                    <input type="radio" name={q.id} value={opt} required={q.required} checked={prev(q, form?.values) === opt} style="width: auto;" />
                    {opt}
                  </label>
                {/each}
              </div>
            {:else if q.type === 'multi_select'}
              <div class="stack" style="gap: 8px;">
                {#each q.options ?? [] as opt, oi (oi)}
                  <label class="row" style="gap: 8px; font-weight: 400;">
                    <input type="checkbox" name={q.id} value={opt} style="width: auto;" />
                    {opt}
                  </label>
                {/each}
              </div>
            {:else if q.type === 'dropdown'}
              <select name={q.id} required={q.required}>
                <option value="" disabled selected hidden>{q.placeholder ?? '—'}</option>
                {#each q.options ?? [] as opt, oi (oi)}
                  <option value={opt}>{opt}</option>
                {/each}
              </select>
            {/if}
          </label>
        {/each}

        <div>
          <button class="btn primary" type="submit" style="padding: 10px 28px;">{t.publicForm.submit}</button>
        </div>
      </form>
    {/if}

    <footer class="public-footer">
      <a href="/" target="_blank" rel="noopener" class="muted">{t.publicForm.poweredBy}</a>
    </footer>
  </div>
</div>
