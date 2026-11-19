import { createHmac } from 'node:crypto';
import { db } from './db';
import { forms, responses, type Form } from './db/schema';
import { snapshotQuestions, validateAnswers } from './questions';

export function isFormOpen(form: Form): boolean {
  if (!form.open) return false;
  if (form.closeDate && form.closeDate.getTime() < Date.now()) return false;
  return true;
}

export async function submitResponse(
  form: Form,
  raw: Record<string, unknown>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isFormOpen(form)) return { ok: false, error: 'closed' };
  const v = validateAnswers(form.questions, raw);
  if (!v.ok) return v;
  const [row] = await db
    .insert(responses)
    .values({ formId: form.id, answers: v.answers, snapshot: snapshotQuestions(form.questions) })
    .returning({ id: responses.id });
  if (form.webhookUrl) void fireWebhook(form, row.id, v.answers);
  return { ok: true, id: row.id };
}

/** Fire-and-forget webhook with HMAC signature and 2 retries. */
async function fireWebhook(form: Form, responseId: string, answers: Record<string, unknown>) {
  const payload = JSON.stringify({
    event: 'response.created',
    formId: form.id,
    responseId,
    submittedAt: new Date().toISOString(),
    answers
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (form.webhookSecret) {
        headers['x-pythia-signature'] = createHmac('sha256', form.webhookSecret).update(payload).digest('hex');
      }
      const res = await fetch(form.webhookUrl!, { method: 'POST', headers, body: payload });
      if (res.ok) return;
    } catch {
      // retry below
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
}
