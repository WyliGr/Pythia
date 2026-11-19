<script lang="ts">
  import { browser } from '$app/environment';
  import { t } from '$lib/i18n';

  // data-theme is already set by the inline script in app.html; SSR renders the default.
  let theme = $state<'light' | 'dark'>(
    browser && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  function toggle() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pythia-theme', theme);
  }
</script>

<button class="icon-btn" onclick={toggle} title={t.nav.themeToggle} aria-label={t.nav.themeToggle}>
  {#if theme === 'light'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
  {:else}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  {/if}
</button>
