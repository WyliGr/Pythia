<script lang="ts">
  import { t } from '$lib/i18n';
  import type { Question } from '$lib/questions';

  let {
    question,
    index,
    total,
    onmove,
    onduplicate,
    ondelete
  }: {
    question: Question;
    index: number;
    total: number;
    onmove: (index: number, dir: -1 | 1) => void;
    onduplicate: (index: number) => void;
    ondelete: (index: number) => void;
  } = $props();

  const isChoice = $derived(['single_choice', 'multi_select', 'dropdown'].includes(question.type));
  const optionsText = $derived((question.options ?? []).join('\n'));

  function setOptions(text: string) {
    question.options = text.split('\n').map((s) => s.trim()).filter(Boolean);
  }
</script>

<div class="q-item stack" style="gap: 10px;">
  <div class="row">
    <span class="q-drag" title="Reorder" aria-hidden="true" style="font-size: 1.1rem;">⋮⋮</span>
    <span class="badge">{t.builder.types[question.type]}</span>
    <div style="flex: 1;"></div>
    <button class="btn small ghost" disabled={index === 0} onclick={() => onmove(index, -1)} title={t.builder.moveUp}>↑</button>
    <button class="btn small ghost" disabled={index === total - 1} onclick={() => onmove(index, 1)} title={t.builder.moveDown}>↓</button>
    <button class="btn small ghost" onclick={() => onduplicate(index)}>{t.builder.duplicate}</button>
    <button class="btn small danger ghost" onclick={() => ondelete(index)}>{t.builder.delete}</button>
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
