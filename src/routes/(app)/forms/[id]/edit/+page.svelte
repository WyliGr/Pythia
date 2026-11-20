<script lang="ts">
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import QuestionEditor from '$lib/components/QuestionEditor.svelte';
  import DateTimePicker from '$lib/components/DateTimePicker.svelte';
  import { migrateQuestionType } from '$lib/questions';
  import type { Question } from '$lib/questions';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const f = data.form;

  let title = $state(f.title);
  let description = $state(f.description);
  let slug = $state(f.slug);
  let open = $state(f.open);
  let closeDate = $state(f.closeDate ? new Date(f.closeDate).toISOString().slice(0, 16) : '');
  let questions = $state<Question[]>(structuredClone(f.questions));

  function addQuestion() {
    questions.push({
      id: crypto.randomUUID().slice(0, 8),
      type: 'short_text',
      label: '',
      required: false
    });
    questions = questions;
  }

  function setType(index: number, type: Question['type']) {
    questions[index] = migrateQuestionType(questions[index], type);
    questions = questions;
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    [questions[index], questions[target]] = [questions[target], questions[index]];
    questions = questions;
  }

  function duplicate(index: number) {
    // $state.snapshot strips the reactive proxy (structuredClone throws on proxies).
    const copy = structuredClone($state.snapshot(questions[index]));
    copy.id = crypto.randomUUID().slice(0, 8);
    questions.splice(index + 1, 0, copy);
    questions = questions;
  }

  function remove(index: number) {
    questions.splice(index, 1);
    questions = questions;
  }

  const questionsJson = $derived(JSON.stringify(questions));
</script>

<svelte:head><title>{title} · {t.builder.title}</title></svelte:head>

<div class="container">
  <div class="row between" style="margin-bottom: 20px;">
    <h1 style="margin: 0;">{t.builder.title}</h1>
    <a class="btn small" href="/f/{slug}" target="_blank">↗ /f/{slug}</a>
  </div>

  {#if form?.error}
    <p class="alert error">{form.error}</p>
  {:else if form?.saved}
    <p class="alert info">{t.builder.saved}</p>
  {/if}

  <form method="POST" action="?/save" use:enhance>
    <input type="hidden" name="questions" value={questionsJson} />

    <div class="stack">
      <div class="card stack">
        <label class="field">
          {t.builder.formTitle}
          <input type="text" name="title" bind:value={title} required placeholder={t.builder.formTitlePlaceholder} style="font-size: 1.05rem; font-weight: 600;" />
        </label>
        <label class="field">
          {t.builder.description}
          <textarea name="description" bind:value={description} placeholder={t.builder.descriptionPlaceholder}></textarea>
        </label>
        <div class="row wrap">
          <label class="field" style="flex: 1; min-width: 200px;">
            {t.builder.slug}
            <span class="hint">{t.builder.slugHint}</span>
            <input type="text" name="slug" bind:value={slug} required pattern={'[a-z0-9][a-z0-9-]{1,62}[a-z0-9]'} />
          </label>
          <label class="field" style="min-width: 200px;">
            {t.builder.closeDate}
            <span class="hint">{t.builder.closeDateHint}</span>
            <DateTimePicker name="closeDate" bind:value={closeDate} />
          </label>
        </div>
        <label class="row" style="gap: 8px; font-size: 0.9rem;">
          <input type="checkbox" name="open" bind:checked={open} style="width: auto;" />
          {t.builder.openLabel}
        </label>
      </div>

      {#each questions as q, i (q.id)}
        <QuestionEditor question={q} index={i} total={questions.length} onmove={move} onduplicate={duplicate} ondelete={remove} ontypechange={setType} />
      {/each}

      <button class="btn add-question" type="button" onclick={addQuestion}>+ {t.builder.addQuestion}</button>

      <div class="row">
        <button class="btn primary" type="submit">{t.builder.save}</button>
        <a class="btn" href="/forms/{f.id}/responses">{t.responses.title}</a>
      </div>
    </div>
  </form>
</div>
