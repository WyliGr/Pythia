<script lang="ts">
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import UserMenu from '$lib/components/UserMenu.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

  const accentStyle = $derived(data.user.accentColor ? `--accent: ${data.user.accentColor}` : '');
</script>

<div style={accentStyle} class="accent-scope">
  <header class="shell-header">
    <div class="inner">
      <a class="brand" href="/forms">
        {#if data.user.logoUrl}
          <img src={data.user.logoUrl} alt="" />
        {:else}
          <span class="dot"></span>
        {/if}
        {t.app.name}
      </a>
      <nav class="row" style="gap: 14px;">
        <a class="nav-link" class:active={$page.url.pathname.startsWith('/forms')} href="/forms">{t.nav.dashboard}</a>
      </nav>
      <div style="flex: 1;"></div>
      <UserMenu user={data.user} />
    </div>
  </header>
  <main class="shell-main">
    {@render children()}
  </main>
</div>
