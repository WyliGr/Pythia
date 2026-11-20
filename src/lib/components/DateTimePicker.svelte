<script lang="ts">
  import { t } from '$lib/i18n';

  /**
   * Custom date+time picker (replaces <input type="datetime-local">).
   * Value format stays datetime-local compatible: 'YYYY-MM-DDTHH:MM' or ''.
   */
  let {
    name,
    value = $bindable(''),
    placeholder = undefined
  }: { name: string; value?: string; placeholder?: string } = $props();

  interface Parts {
    y: number;
    m: number; // 1-12
    d: number;
    hh: number;
    mm: number;
  }

  function parse(v: string): Parts | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
    if (!match) return null;
    return { y: +match[1], m: +match[2], d: +match[3], hh: +match[4], mm: +match[5] };
  }

  const parsed = $derived(parse(value));
  const pad = (n: number) => String(n).padStart(2, '0');

  function formatDisplay(p: Parts): string {
    return `${t.picker.months[p.m - 1].slice(0, 3)} ${p.d}, ${p.y} · ${pad(p.hh)}:${pad(p.mm)}`;
  }

  let open = $state(false);
  let root = $state<HTMLDivElement | null>(null);
  let cy = $state(new Date().getFullYear());
  let cm = $state(new Date().getMonth() + 1);

  function toggle() {
    if (!open) {
      // Open on the selected month, or the current one.
      cy = parsed?.y ?? new Date().getFullYear();
      cm = parsed?.m ?? new Date().getMonth() + 1;
    }
    open = !open;
  }

  function shiftMonth(dir: -1 | 1) {
    const m = cm + dir;
    if (m < 1) {
      cm = 12;
      cy -= 1;
    } else if (m > 12) {
      cm = 1;
      cy += 1;
    } else {
      cm = m;
    }
  }

  const daysInMonth = $derived(new Date(cy, cm, 0).getDate());
  // Week starts on Monday.
  const firstOffset = $derived((new Date(cy, cm - 1, 1).getDay() + 6) % 7);

  const todayYmd = (() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  })();

  function pickDay(d: number) {
    const hh = parsed?.hh ?? 12;
    const mm = parsed?.mm ?? 0;
    value = `${cy}-${pad(cm)}-${pad(d)}T${pad(hh)}:${pad(mm)}`;
  }

  function setTime(hh: number, mm: number) {
    if (!parsed) return;
    hh = Math.min(23, Math.max(0, Math.floor(hh) || 0));
    mm = Math.min(59, Math.max(0, Math.floor(mm) || 0));
    value = `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}T${pad(hh)}:${pad(mm)}`;
  }

  function clear() {
    value = '';
    open = false;
  }

  function pickToday() {
    const n = new Date();
    value = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(parsed?.hh ?? n.getHours())}:${pad(parsed?.mm ?? 0)}`;
  }

  function onWindowPointerDown(e: PointerEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
  function onWindowKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') open = false;
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeydown} />

<div class="dtp" bind:this={root}>
  <input type="hidden" {name} {value} />
  <button type="button" class="btn dtp-toggle" aria-expanded={open} aria-label={t.builder.closeDate} onclick={toggle}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    <span class:muted={!parsed}>{parsed ? formatDisplay(parsed) : (placeholder ?? t.picker.notSet)}</span>
  </button>

  {#if open}
    <div class="dtp-pop" role="dialog" aria-label={t.builder.closeDate}>
      <div class="dtp-head">
        <button type="button" class="icon-btn" aria-label="Previous month" onclick={() => shiftMonth(-1)}>‹</button>
        <span class="dtp-title">{t.picker.months[cm - 1]} {cy}</span>
        <button type="button" class="icon-btn" aria-label="Next month" onclick={() => shiftMonth(1)}>›</button>
      </div>

      <div class="dtp-grid">
        {#each t.picker.weekdays as w (w)}
          <span class="dtp-wd">{w}</span>
        {/each}
        {#each Array.from({ length: firstOffset }) as _, i (i)}
          <span></span>
        {/each}
        {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as d (d)}
          {@const selected = parsed && parsed.y === cy && parsed.m === cm && parsed.d === d}
          {@const isToday = todayYmd.y === cy && todayYmd.m === cm && todayYmd.d === d}
          <button
            type="button"
            class="dtp-day"
            class:selected
            class:today={isToday}
            aria-pressed={!!selected}
            onclick={() => pickDay(d)}>{d}</button
          >
        {/each}
      </div>

      <div class="dtp-foot">
        <span class="muted small">{t.picker.time}</span>
        <input
          type="number"
          min="0"
          max="23"
          aria-label="Hours"
          disabled={!parsed}
          value={parsed ? pad(parsed.hh) : '12'}
          onchange={(e) => setTime(+e.currentTarget.value, parsed?.mm ?? 0)}
        />
        <span class="muted">:</span>
        <input
          type="number"
          min="0"
          max="59"
          aria-label="Minutes"
          disabled={!parsed}
          value={parsed ? pad(parsed.mm) : '00'}
          onchange={(e) => setTime(parsed?.hh ?? 12, +e.currentTarget.value)}
        />
        <span style="flex: 1;"></span>
        <button type="button" class="btn small ghost" onclick={pickToday}>{t.picker.today}</button>
        <button type="button" class="btn small ghost" onclick={clear}>{t.picker.clear}</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dtp {
    position: relative;
  }
  .dtp-toggle {
    width: 100%;
    justify-content: flex-start;
    font-weight: 400;
  }
  .dtp-pop {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 30;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18);
    padding: 12px;
    width: 264px;
  }
  .dtp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .dtp-title {
    font-weight: 600;
    font-size: 0.92rem;
  }
  .dtp-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }
  .dtp-wd {
    text-align: center;
    font-size: 0.7rem;
    color: var(--text-dim);
    padding: 2px 0;
    font-weight: 600;
    text-transform: uppercase;
  }
  .dtp-day {
    border: 1px solid transparent;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;
    height: 30px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .dtp-day:hover {
    background: var(--bg-subtle);
  }
  .dtp-day.today {
    border-color: var(--accent);
  }
  .dtp-day.selected {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }
  .dtp-foot {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .dtp-foot input {
    width: 56px;
  }
</style>
