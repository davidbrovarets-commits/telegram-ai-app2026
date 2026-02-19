/**
 * Word Validation Layer — Reusable validators for news text fields
 *
 * Uses countWords() for deterministic measurement against SSOT rules.
 *
 * CR-007: Word-Based Normalization
 */

import { countWords } from './word-count';

export interface WordValidationResult {
    ok: boolean;
    count: number;
    message: string;
}

/**
 * Validate that text word count is within [min, max] range.
 */
export function validateWordRange(
    label: string,
    text: string,
    min: number,
    max: number
): WordValidationResult {
    const count = countWords(text);

    if (count < min) {
        return {
            ok: false,
            count,
            message: `${label}: ${count} words < min ${min}`,
        };
    }

    if (count > max) {
        return {
            ok: false,
            count,
            message: `${label}: ${count} words > max ${max}`,
        };
    }

    return {
        ok: true,
        count,
        message: `${label}: ${count} words OK (${min}–${max})`,
    };
}

/**
 * Validate that text ends with a sentence-ending character: . ! ?
 */
export function validateFullSentence(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return /[.!?]$/.test(trimmed);
}

/**
 * Validate title against full title rules (word range + sentence ending).
 */
export function validateTitleRules(
    title: string,
    rules: { minWords: number; maxWords: number; requireFullSentence: boolean }
): { ok: boolean; issues: string[] } {
    const issues: string[] = [];

    const rangeResult = validateWordRange('title', title, rules.minWords, rules.maxWords);
    if (!rangeResult.ok) {
        issues.push(rangeResult.message);
    }

    if (rules.requireFullSentence && !validateFullSentence(title)) {
        issues.push('title: must end with . ! or ?');
    }

    return {
        ok: issues.length === 0,
        issues,
    };
}
