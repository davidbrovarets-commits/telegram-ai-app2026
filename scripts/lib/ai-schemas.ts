/**
 * Zod Schemas for AI Output Validation
 * 
 * Ensures AI-generated JSON strictly matches expected shapes.
 * Rejects extra keys, enforces types and value constraints.
 */

import { z } from 'zod';

/** Valid action tags that can appear in enrichment output */
const ACTION_TAGS = ['deadline', 'money', 'documents', 'event', 'important'] as const;

/** Valid reason tags */
const REASON_TAGS = [
    'OFFICIAL_UPDATE',
    'IMPORTANT_LOCAL',
    'FOR_UKRAINIANS',
    'EVENT_NEAR_YOU',
] as const;

/**
 * Schema for the AI enrichment response from Gemini.
 * Uses .strict() to reject any extra/injected keys.
 */
export const AiEnrichSchema = z.object({
    // CR-007: Safety caps only — editorial limits enforced by word-validate.ts
    de_summary: z.string().max(2000).default(''),
    uk_summary: z.string().min(1).max(2000),
    uk_content: z.string().min(1).max(8000),
    uk_title: z.string().min(1).max(300),
    action_hint: z.string().max(300).default(''),
    actions: z.array(z.enum(ACTION_TAGS)).max(3).default([]),
    reasonTag: z.enum(REASON_TAGS).optional(),
}).strict();

/** Inferred TypeScript type from the schema */
export type AiEnrichResult = z.infer<typeof AiEnrichSchema>;
