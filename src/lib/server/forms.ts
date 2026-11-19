import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './db';
import { forms, responses, type Form, type FormResponse } from './db/schema';
import { validateQuestions } from './questions';

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export interface FormInput {
  title: string;
  description?: string;
  slug: string;
  open?: boolean;
  closeDate?: string | null;
  questions?: unknown;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
}

export async function listForms(userId: string): Promise<Form[]> {
  return db.select().from(forms).where(eq(forms.userId, userId)).orderBy(desc(forms.updatedAt));
}

export async function getOwnedForm(userId: string, id: string): Promise<Form | null> {
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, id), eq(forms.userId, userId)))
    .limit(1);
  return form ?? null;
}

export async function createForm(
  userId: string,
  input: FormInput
): Promise<{ ok: true; form: Form } | { ok: false; error: string }> {
  const checked = await checkInput(input);
  if (!checked.ok) return checked;
  const [form] = await db
    .insert(forms)
    .values({ userId, ...checked.values })
    .returning();
  return { ok: true, form };
}

export async function updateForm(
  userId: string,
  id: string,
  input: Partial<FormInput>
): Promise<{ ok: true; form: Form } | { ok: false; error: string }> {
  const existing = await getOwnedForm(userId, id);
  if (!existing) return { ok: false, error: 'not_found' };

  const merged: FormInput = {
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    slug: input.slug ?? existing.slug,
    open: input.open ?? existing.open,
    closeDate: input.closeDate === undefined ? existing.closeDate?.toISOString() : input.closeDate,
    questions: input.questions ?? existing.questions,
    webhookUrl: input.webhookUrl === undefined ? existing.webhookUrl : input.webhookUrl,
    webhookSecret: input.webhookSecret === undefined ? existing.webhookSecret : input.webhookSecret
  };
  const checked = await checkInput(merged, id);
  if (!checked.ok) return checked;
  const [form] = await db.update(forms).set({ ...checked.values, updatedAt: new Date() }).where(eq(forms.id, id)).returning();
  return { ok: true, form };
}

async function checkInput(
  input: FormInput,
  selfId?: string
): Promise<{ ok: true; values: Omit<typeof forms.$inferInsert, 'userId'> } | { ok: false; error: string }> {
  if (!input.title?.trim()) return { ok: false, error: 'title is required' };
  if (!SLUG_RE.test(input.slug ?? '')) {
    return { ok: false, error: 'slug must be 3-64 chars of a-z, 0-9 and hyphens' };
  }
  if (input.webhookUrl && !/^https?:\/\//.test(input.webhookUrl)) {
    return { ok: false, error: 'webhookUrl must be http(s)' };
  }
  const q = validateQuestions(input.questions ?? []);
  if (!q.ok) return { ok: false, error: q.error };

  const clashConditions = [eq(forms.slug, input.slug)];
  const clash = await db.select({ id: forms.id }).from(forms).where(and(...clashConditions)).limit(1);
  if (clash.length > 0 && clash[0].id !== selfId) return { ok: false, error: 'slug already in use' };

  return {
    ok: true,
    values: {
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      slug: input.slug,
      open: input.open ?? true,
      closeDate: input.closeDate ? new Date(input.closeDate) : null,
      questions: q.questions,
      webhookUrl: input.webhookUrl ?? null,
      webhookSecret: input.webhookSecret ?? null
    }
  };
}

export async function getFormResponses(userId: string, formId: string): Promise<FormResponse[] | null> {
  const form = await getOwnedForm(userId, formId);
  if (!form) return null;
  return db.select().from(responses).where(eq(responses.formId, formId)).orderBy(asc(responses.submittedAt));
}
