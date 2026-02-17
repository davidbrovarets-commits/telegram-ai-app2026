/**
 * AI Output Guards
 * 
 * Runtime validation and clamping of AI-produced fields
 * before they enter the database.
 */

import { AiEnrichSchema, type AiEnrichResult } from './ai-schemas';

/**
 * Validate and clamp raw AI output against the strict schema.
 * 
 * Throws 'AI_SCHEMA_INVALID' if the output doesn't conform.
 * Also applies additional guardrails:
 * - Deduplicates action tags
 * - Trims string fields
 */
export function clampAiEnrich(raw: unknown): AiEnrichResult {
    const result = AiEnrichSchema.safeParse(raw);

    if (!result.success) {
        const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`AI_SCHEMA_INVALID: ${issues}`);
    }

    const data = result.data;

    // Deduplicate actions
    data.actions = [...new Set(data.actions)];

    // Trim string fields
    data.de_summary = data.de_summary.trim();
    data.uk_summary = data.uk_summary.trim();
    data.uk_content = data.uk_content.trim();
    data.uk_title = data.uk_title.trim();
    data.action_hint = data.action_hint.trim();

    return data;
}
