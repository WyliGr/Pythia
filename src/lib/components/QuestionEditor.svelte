<script lang="ts">
  import { t } from '$lib/i18n';
  import { QUESTION_TYPES, type Question } from '$lib/questions';

  let {
    question,
    index,
    total,
    onmove,
    onduplicate,
    ondelete,
    ontypechange
  }: {
    question: Question;
    index: number;
    total: number;
    onmove: (index: number, dir: -1 | 1) => void;
    onduplicate: (index: number) => void;
    ondelete: (index: number) => void;
    ontypechange: (index: number, type: Question['type']) => void;
  } = $props();

  const isChoice = $derived(['single_choice', 'multi_select', 'dropdown'].includes(question.type));
  const optionsText = $derived((question.options ?? []).join('\n'));

  function setOptions(text: string) {
    question.options = text.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  function handleType(e: Event) {
    ontypechange(index, (e.currentTarget as HTMLSelectElement).value as Question['type']);
  }
</script>

<div class="q-item stack" style="gap: 10px;">
  <div class="row">
    <span class="q-drag" title="Reorder" aria-hidden="true" style="font-size: 1.1rem;">⋮⋮</span>
    <select
      class="q-type"
      value={question.type}
      title={t.builder.typeLabel}
      aria-label={t.builder.typeLabel}
      onchange={handleType}
    >
      {#each QUESTION_TYPES as type (type)}
        <option value={type}>{t.builder.types[type]}</option>
      {/each}
    </select>
    <div style="flex: 1;"></div>
    <button type="button" class="btn small ghost" disabled={index === 0} onclick={() => onmove(index, -1)} title={t.builder.moveUp}>↑</button>
    <button type="button" class="btn small ghost" disabled={index === total - 1} onclick={() => onmove(index, 1)} title={t.builder.moveDown}>↓</button>
    <button type="button" class="btn small ghost" onclick={() => onduplicate(index)}>{t.builder.duplicate}</button>
    <button type="button" class="btn small danger ghost" onclick={() => ondelete(index)}>{t.builder.delete}</button>
  </div>

  <div class="row" style="align-items: flex-start; gap: 10px;">
    <label class="field" style="flex: 1;">
      {t.builder.questionLabel}
      <input type="text" bind:value={question.label} placeholder={t.builder.questionLabelPlaceholder} />
    </label>
    <label class="field" style="flex-direction: row; align-items: center; gap: 6px; margin-top: 26px; white-space: nowrap;">
      <input type="checkbox" bind:checked={question.required} style="width: auto;" />
      {t.builder.required}
    </label>
  </div>

  {#if question.type === 'short_text' || question.type === 'email' || question.type === 'number'}
    <label class="field">
      {t.builder.placeholder}
      <input type="text" bind:value={question.placeholder} />
    </label>
  {/if}

  {#if isChoice}
    <label class="field">
      {t.builder.options}
      <span class="hint">{t.builder.optionsHint}</span>
      <textarea rows={3} value={optionsText} oninput={(e) => setOptions(e.currentTarget.value)}></textarea>
    </label>
  {/if}

  {#if question.type === 'rating'}
    <label class="field" style="max-width: 120px;">
      {t.builder.maxRating}
      <input type="number" min="2" max="10" bind:value={question.maxRating} />
    </label>
  {/if}

  <label class="field">
    {t.builder.helpText}
    <input type="text" bind:value={question.helpText} />
  </label>
</div>

<style>
  .q-type {
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    width: auto;
    color: var(--accent);
    background-color: var(--accent-soft);
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 4px 26px 5px 12px;
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='6' viewBox='0 0 9 6'%3E%3Cpath d='M1 1l3.5 3.5L8 1' fill='none' stroke='%2388919f' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    min-width: 0;
    margin: 0;
    box-shadow: none;
  }
  .q-type:hover {
    border-color: var(--border-strong);
    box-shadow: none;
  }
  .q-type:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
</style>
