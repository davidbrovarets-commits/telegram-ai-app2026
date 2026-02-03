
/**
 * Shared formatter for News UI strict rules (L6 Fix Pack).
 * Single source of truth for title and summary truncation.
 */

/**
 * Limit title to 7 tokens max.
 * If truncated, append '...' to the last token.
 * 
 * Rule: "uudise pealkiri peab olema max 7 sõna"
 */
export function formatTitle7Words(input: string): string {
    if (!input) return '';

    // Normalize whitespace
    const normalized = input.trim().replace(/\s+/g, ' ');
    const words = normalized.split(' ');

    if (words.length <= 7) {
        return normalized;
    }

    // Take first 7 words
    const truncated = words.slice(0, 7);
    // Append ellipsis to the last word
    truncated[6] = truncated[6] + '...';

    return truncated.join(' ');
}

/**
 * Limit summary to 200 words max.
 * If truncated, append '...'.
 */
export function formatSummary200Words(input: string): string {
    if (!input) return '';

    // Normalize whitespace
    const normalized = input.trim().replace(/\s+/g, ' ');
    const words = normalized.split(' ');

    if (words.length <= 200) {
        return normalized;
    }

    return words.slice(0, 200).join(' ') + '...';
}
