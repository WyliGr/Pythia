<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>{t.admin.title} · {t.app.name}</title></svelte:head>

<div class="container wide">
  <h1>{t.admin.title}</h1>

  <div class="stack">
    <div class="row wrap" style="gap: 12px;">
      <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 700;">{data.totals.users}</div>
        <div class="muted small">{t.admin.totalUsers}</div>
      </div>
      <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 700;">{data.totals.forms}</div>
        <div class="muted small">{t.admin.totalForms}</div>
      </div>
      <div class="card" style="flex: 1; min-width: 150px; text-align: center;">
        <div style="font-size: 1.8rem; font-weight: 700;">{data.totals.responses}</div>
        <div class="muted small">{t.admin.totalResponses}</div>
      </div>
    </div>

    <div class="card stack">
      <h2>{t.admin.users}</h2>
      <table class="table">
        <thead>
          <tr>
            <th>{t.admin.email}</th><th>{t.admin.role}</th><th>{t.admin.formsCount}</th>
            <th>{t.admin.responsesCount}</th><th>{t.admin.joined}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.users as u (u.id)}
            <tr>
              <td>{u.email}{#if u.name} <span class="muted">· {u.name}</span>{/if}</td>
              <td><span class="badge" class:accent={u.isAdmin}>{u.isAdmin ? t.admin.adminRole : t.admin.userRole}</span></td>
              <td>{u.formsCount}</td>
              <td>{u.responsesCount}</td>
              <td class="small muted">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td style="white-space: nowrap; text-align: right;">
                {#if u.id !== data.user.id}
                  <form method="POST" action="?/toggleAdmin" style="display: inline;">
                    <input type="hidden" name="id" value={u.id} />
                    <button class="btn small" type="submit">{u.isAdmin ? t.admin.revokeAdmin : t.admin.makeAdmin}</button>
                  </form>
                  <form
                    method="POST"
                    action="?/deleteUser"
                    style="display: inline;"
                    use:enhance={({ cancel }) => {
                      if (!confirm(t.admin.deleteUserConfirm)) cancel();
                    }}
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <button class="btn small danger" type="submit">{t.admin.deleteUser}</button>
                  </form>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <form method="POST" action="?/saveDefaults" class="card stack">
      <h2>{t.admin.defaults}</h2>
      <p class="muted small" style="margin: 0;">{t.admin.defaultsHint}</p>
      {#if form?.savedDefaults}<p class="alert info">{t.admin.saved}</p>{/if}
      {#if form?.error}<p class="alert error">{form.error}</p>{/if}
      <div class="row wrap">
        <label class="field" style="width: 140px;">
          {t.settings.accentColor}
          <input type="color" name="defaultAccentColor" value={data.defaults?.defaultAccentColor ?? '#3d63dd'} style="height: 40px; padding: 3px;" />
        </label>
        <label class="field" style="flex: 1; min-width: 220px;">
          {t.settings.logoUrl}
          <input type="url" name="defaultLogoUrl" value={data.defaults?.defaultLogoUrl ?? ''} />
        </label>
      </div>
      <div><button class="btn primary" type="submit">{t.admin.save}</button></div>
    </form>
  </div>
</div>
