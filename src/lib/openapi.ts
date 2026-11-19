/** OpenAPI 3.1 spec for the Pythia REST API. Served at /api/openapi.json. */
export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Pythia API',
    version: '1.0.0',
    description:
      'REST API for Pythia, the self-hosted forms tool. Authenticate with a personal API key: `Authorization: Bearer pk_…`. Keys are created in Settings → API keys and carry scopes (`forms:read`, `forms:write`, `responses:read`).'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', description: 'API key, see Settings → API keys' }
    },
    schemas: {
      Question: {
        type: 'object',
        required: ['id', 'type', 'label', 'required'],
        properties: {
          id: { type: 'string' },
          type: {
            type: 'string',
            enum: ['short_text', 'long_text', 'single_choice', 'multi_select', 'dropdown', 'rating', 'date', 'email', 'number']
          },
          label: { type: 'string' },
          required: { type: 'boolean' },
          placeholder: { type: 'string' },
          helpText: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, description: 'Required for choice types' },
          maxRating: { type: 'integer', minimum: 2, maximum: 10 }
        }
      },
      Form: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          slug: { type: 'string' },
          open: { type: 'boolean' },
          closeDate: { type: ['string', 'null'], format: 'date-time' },
          questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } },
          webhookUrl: { type: ['string', 'null'] },
          webhookSecret: { type: ['string', 'null'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Response: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          submittedAt: { type: 'string', format: 'date-time' },
          questions: {
            type: 'array',
            description: 'Snapshot of questions at submission time',
            items: {
              type: 'object',
              properties: { id: { type: 'string' }, label: { type: 'string' }, type: { type: 'string' } }
            }
          },
          answers: { type: 'object', description: 'Map of question id → answer. Choice arrays for multi_select; null for skipped optional questions.' }
        }
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/forms': {
      get: {
        summary: 'List forms',
        description: 'Requires `forms:read`.',
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { forms: { type: 'array', items: { $ref: '#/components/schemas/Form' } } } } } }
          },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Missing scope', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      post: {
        summary: 'Create form',
        description: 'Requires `forms:write`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'slug'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  slug: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' },
                  open: { type: 'boolean' },
                  closeDate: { type: ['string', 'null'], format: 'date-time' },
                  questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { form: { $ref: '#/components/schemas/Form' } } } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Slug already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/forms/{id}': {
      get: {
        summary: 'Get one form',
        description: 'Requires `forms:read`.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { form: { $ref: '#/components/schemas/Form' } } } } } },
          '404': { description: 'Not found' }
        }
      },
      patch: {
        summary: 'Update form',
        description: 'Requires `forms:write`. Only provided fields change.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  slug: { type: 'string' },
                  open: { type: 'boolean' },
                  closeDate: { type: ['string', 'null'], format: 'date-time' },
                  questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } },
                  webhookUrl: { type: ['string', 'null'] },
                  webhookSecret: { type: ['string', 'null'] }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { form: { $ref: '#/components/schemas/Form' } } } } } },
          '400': { description: 'Validation error' },
          '404': { description: 'Not found' },
          '409': { description: 'Slug already in use' }
        }
      }
    },
    '/forms/{id}/responses': {
      get: {
        summary: 'List responses for a form',
        description: 'Requires `responses:read`. Each response embeds the question snapshot captured at submission time, so columns stay stable even after the form is edited.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'OK',
            content: { 'application/json': { schema: { type: 'object', properties: { responses: { type: 'array', items: { $ref: '#/components/schemas/Response' } } } } } }
          },
          '404': { description: 'Not found' }
        }
      }
    }
  }
} as const;
