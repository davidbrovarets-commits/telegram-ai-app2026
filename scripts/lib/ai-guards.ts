/**
 * AI Output Guards
 * 
 * Runtime validation and clamping of AI-produced fields
 * before they enter the database.
 *
 * CR-007: Added word-based validation using SSOT rules.
 */

import { AiEnrichSchema, type AiEnrichResult } from './ai-schemas';
import { NEWS_TEXT_RULES } from '../../src/config/newsTextRules';
import { validateTitleRules, validateWordRange } from './word-validate';

/**
 * Validate and clamp raw AI output against the strict schema,
 * then enforce word-based rules from SSOT.
 * 
 * Throws 'AI_SCHEMA_INVALID' if the output doesn't conform to schema.
 * Throws 'AI_WORD_VALIDATION' if word counts are outside SSOT ranges.
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

    // ── CR-007: Word-based validation ──────────────────────
    const wordIssues: string[] = [];

    // Title
    const titleResult = validateTitleRules(data.uk_title, NEWS_TEXT_RULES.title);
    if (titleResult.ok) {
        console.log(`[WORDCHECK] title OK`);
    } else {
        titleResult.issues.forEach(i => wordIssues.push(i));
        console.warn(`[WORDCHECK] title FAIL: ${titleResult.issues.join('; ')}`);
    }

    // Summary
    const summaryResult = validateWordRange(
        'uk_summary', data.uk_summary,
        NEWS_TEXT_RULES.feedSummary.minWords, NEWS_TEXT_RULES.feedSummary.maxWords
    );
    console.log(`[WORDCHECK] ${summaryResult.message}`);
    if (!summaryResult.ok) wordIssues.push(summaryResult.message);

    // Content
    const contentResult = validateWordRange(
        'uk_content', data.uk_content,
        NEWS_TEXT_RULES.detailContent.minWords, NEWS_TEXT_RULES.detailContent.maxWords
    );
    console.log(`[WORDCHECK] ${contentResult.message}`);
    if (!contentResult.ok) wordIssues.push(contentResult.message);

    if (wordIssues.length > 0) {
        throw new Error(`AI_WORD_VALIDATION: ${wordIssues.join('; ')}`);
    }

    return data;
}
