<script lang="ts">
  import { t } from '$lib/i18n';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>{t.auth.login} · {t.app.name}</title></svelte:head>

<div class="public-wrap" style="max-width: 400px;">
  <div class="row between" style="margin-bottom: 32px;">
    <span class="brand"><span class="dot"></span>{t.app.name}</span>
    <ThemeToggle />
  </div>
  <h1 style="font-size: 1.5rem;">{t.auth.loginTitle}</h1>
  {#if form?.error}
    <p class="alert error">{form.error}</p>
  {/if}
  <form method="POST" class="stack" style="margin-top: 20px;">
    <label class="field">
      {t.auth.email}
      <input type="email" name="email" required autocomplete="email" value={form?.email ?? ''} />
    </label>
    <label class="field">
      {t.auth.password}
      <input type="password" name="password" required autocomplete="current-password" />
    </label>
    <button class="btn primary" type="submit">{t.auth.login}</button>
  </form>
  <p class="muted small" style="margin-top: 24px;">
    {t.auth.noAccount} <a href="/signup">{t.auth.signup}</a>
  </p>
</div>
