/**
 * Word Count Engine — Deterministic text measurement
 *
 * Provides normalizeText() and countWords() for consistent
 * word counting across the entire pipeline.
 *
 * CR-007: Word-Based Normalization
 */

/**
 * Normalize text for consistent word counting.
 * - Trims leading/trailing whitespace
 * - Collapses multiple whitespace to single space
 * - Normalizes line breaks to spaces
 */
export function normalizeText(text: string): string {
    if (!text) return '';
    return text
        .replace(/\r\n/g, '\n')       // normalize CRLF → LF
        .replace(/\n+/g, ' ')          // line breaks → space
        .replace(/\s+/g, ' ')          // collapse whitespace
        .trim();
}

/**
 * Count words in text deterministically.
 * Split by whitespace, filter empty tokens.
 */
export function countWords(text: string): number {
    const normalized = normalizeText(text);
    if (normalized === '') return 0;
    return normalized.split(' ').filter(w => w.length > 0).length;
}
