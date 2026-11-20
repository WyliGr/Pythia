<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let { user }: { user: { name: string; email: string; avatarUrl: string | null } } = $props();

  let open = $state(false);
  let root = $state<HTMLDivElement | undefined>(undefined);

  onMount(() => {
    const down = (e: PointerEvent) => {
      if (root && !root.contains(e.target as Node)) open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open = false;
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('keydown', key);
    };
  });
</script>

<div class="usermenu" bind:this={root}>
  <button
    type="button"
    class="avatar-btn"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={t.nav.account}
    onclick={() => (open = !open)}
  >
    <span class="avatar-circle">
      {#if user.avatarUrl}
        <img src={user.avatarUrl} alt="" />
      {:else}
        {(user.name || user.email).slice(0, 1).toUpperCase()}
      {/if}
    </span>
  </button>
  {#if open}
    <div class="usermenu-drop" role="menu">
      <div class="usermenu-user">
        <strong>{user.name || user.email}</strong>
        {#if user.name}<span class="muted small">{user.email}</span>{/if}
      </div>
      <a class="usermenu-item" href="/settings" role="menuitem" onclick={() => (open = false)}>
        {t.nav.settings}
      </a>
      <div class="usermenu-item usermenu-theme">
        <span>{t.nav.theme}</span>
        <ThemeToggle />
      </div>
      <form method="POST" action="/logout">
        <button class="usermenu-item usermenu-logout" type="submit" role="menuitem">
          {t.nav.logout}
        </button>
      </form>
    </div>
  {/if}
</div>

<style>
  .usermenu {
    position: relative;
  }
  .avatar-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    font: inherit;
    color: inherit;
    min-width: 0;
    box-shadow: none;
  }
  .avatar-btn:hover {
    box-shadow: none;
  }
  .avatar-btn .avatar-circle {
    transition: border-color 0.12s ease;
  }
  .avatar-btn:hover .avatar-circle,
  .avatar-btn:focus-visible .avatar-circle {
    border-color: var(--accent);
  }
  .usermenu-drop {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    min-width: 210px;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
    padding: 6px;
    display: flex;
    flex-direction: column;
    z-index: 60;
  }
  .usermenu-user {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 10px 10px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
    min-width: 0;
  }
  .usermenu-user strong,
  .usermenu-user span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .usermenu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: 0.9rem;
    color: var(--text);
    text-decoration: none;
    cursor: pointer;
    text-align: left;
    min-width: 0;
    box-shadow: none;
  }
  .usermenu-item:hover {
    background: var(--bg-subtle);
    box-shadow: none;
  }
  .usermenu-logout {
    color: var(--danger);
  }
</style>
