import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';

export interface Question {
  id: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multi_select' | 'dropdown' | 'rating' | 'date' | 'email' | 'number';
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // choice types only
  maxRating?: number; // rating only
}

export interface QuestionSnapshot {
  id: string;
  label: string;
  type: Question['type'];
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  name: text('name').notNull().default(''),
  accentColor: text('accent_color'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  scopes: text('scopes').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true })
});

export const forms = pgTable(
  'forms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    slug: text('slug').notNull().unique(),
    open: boolean('open').notNull().default(true),
    closeDate: timestamp('close_date', { withTimezone: true }),
    questions: jsonb('questions').$type<Question[]>().notNull().default([]),
    webhookUrl: text('webhook_url'),
    webhookSecret: text('webhook_secret'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('forms_user_idx').on(t.userId)]
);

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
    answers: jsonb('answers').$type<Record<string, unknown>>().notNull(),
    snapshot: jsonb('snapshot').$type<QuestionSnapshot[]>().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('responses_form_idx').on(t.formId)]
);

// Single-row instance settings (id = 1).
export const settings = pgTable('settings', {
  id: integer('id').primaryKey(),
  defaultAccentColor: text('default_accent_color').notNull().default('#3d63dd'),
  defaultLogoUrl: text('default_logo_url')
});

export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type FormResponse = typeof responses.$inferSelect;
