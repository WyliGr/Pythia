<script lang="ts">
  import { t } from '$lib/i18n';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import type { ActionData, PageData } from './$types';

  let { form, data }: { form: ActionData; data: PageData } = $props();
</script>

<svelte:head><title>{t.auth.signup} · {t.app.name}</title></svelte:head>

<div class="public-wrap" style="max-width: 400px;">
  <div class="row between" style="margin-bottom: 32px;">
    <span class="brand"><span class="dot"></span>{t.app.name}</span>
    <ThemeToggle />
  </div>
  <h1 style="font-size: 1.5rem;">{t.auth.signupTitle}</h1>
  {#if data.isFirst}
    <p class="alert info" style="margin-top: 12px;">{t.auth.firstUserNotice}</p>
  {/if}
  {#if form?.error}
    <p class="alert error">{form.error}</p>
  {/if}
  <form method="POST" class="stack" style="margin-top: 20px;">
    <label class="field">
      {t.auth.name} <span class="hint">({t.auth.nameOptional})</span>
      <input type="text" name="name" autocomplete="name" value={form?.name ?? ''} />
    </label>
    <label class="field">
      {t.auth.email}
      <input type="email" name="email" required autocomplete="email" value={form?.email ?? ''} />
    </label>
    <label class="field">
      {t.auth.password}
      <span class="hint">{t.auth.passwordHint}</span>
      <input type="password" name="password" required minlength="8" autocomplete="new-password" />
    </label>
    <button class="btn primary" type="submit">{t.auth.signup}</button>
  </form>
  <p class="muted small" style="margin-top: 24px;">
    {t.auth.hasAccount} <a href="/login">{t.auth.login}</a>
  </p>
</div>
