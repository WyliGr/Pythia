import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createForm, getFormResponses, listForms, updateForm } from './forms';
import { hasScope, type Scope } from './apikeys';
import type { ApiKey } from './db/schema';
import { QUESTION_TYPES } from './questions';

const questionShape = z.object({
  id: z.string().min(1).describe('Unique question id, e.g. "q1"'),
  type: z.enum(QUESTION_TYPES),
  label: z.string(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional().describe('Required for single_choice, multi_select, dropdown'),
  maxRating: z.number().int().min(2).max(10).optional().describe('Rating scale max, default 5')
});

function text(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

/** Build a fresh server per request — the transport is stateless. */
export function createPythiaMcpServer(apiKey: ApiKey): McpServer {
  const userId = apiKey.userId;
  const guard = (scope: Scope): { content: { type: 'text'; text: string }[] } | null =>
    hasScope(apiKey, scope) ? null : text({ error: `Key lacks required scope: ${scope}` });
  const server = new McpServer({ name: 'pythia', version: '1.0.0' });

  server.registerTool(
    'list_forms',
    {
      title: 'List forms',
      description: "List the authenticated account's forms (id, title, slug, open state)."
    },
    async () => {
      const denied = guard('forms:read');
      if (denied) return denied;
      const forms = await listForms(userId);
      return text(
        forms.map((f) => ({ id: f.id, title: f.title, slug: f.slug, open: f.open, closeDate: f.closeDate, updatedAt: f.updatedAt }))
      );
    }
  );

  server.registerTool(
    'create_form',
    {
      title: 'Create form',
      description: 'Create a new form with questions. Returns the form including its public slug.',
      inputSchema: {
        title: z.string(),
        description: z.string().optional(),
        slug: z.string().describe('Public URL slug: lowercase letters, digits, hyphens, 3-64 chars'),
        open: z.boolean().optional().describe('Accepting responses, default true'),
        closeDate: z.string().optional().describe('ISO 8601 datetime, optional'),
        questions: z.array(questionShape).optional()
      }
    },
    async (input) => {
      const denied = guard('forms:write');
      if (denied) return denied;
      const result = await createForm(userId, { ...input, closeDate: input.closeDate ?? null });
      if (!result.ok) return text({ error: result.error });
      return text(result.form);
    }
  );

  server.registerTool(
    'update_form',
    {
      title: 'Update form',
      description: 'Update fields of an existing form. Only provided fields change.',
      inputSchema: {
        id: z.string().describe('Form id'),
        title: z.string().optional(),
        description: z.string().optional(),
        slug: z.string().optional(),
        open: z.boolean().optional(),
        closeDate: z.string().nullable().optional(),
        questions: z.array(questionShape).optional(),
        webhookUrl: z.string().nullable().optional(),
        webhookSecret: z.string().nullable().optional()
      }
    },
    async ({ id, ...input }) => {
      const denied = guard('forms:write');
      if (denied) return denied;
      const result = await updateForm(userId, id, input);
      if (!result.ok) return text({ error: result.error });
      return text(result.form);
    }
  );

  server.registerTool(
    'get_responses',
    {
      title: 'Get responses',
      description: 'Fetch all responses for a form, with the question snapshot stored at submission time.',
      inputSchema: { formId: z.string().describe('Form id') }
    },
    async ({ formId }) => {
      const denied = guard('responses:read');
      if (denied) return denied;
      const rows = await getFormResponses(userId, formId);
      if (!rows) return text({ error: 'not_found' });
      return text(rows.map((r) => ({ id: r.id, submittedAt: r.submittedAt, questions: r.snapshot, answers: r.answers })));
    }
  );

  return server;
}
