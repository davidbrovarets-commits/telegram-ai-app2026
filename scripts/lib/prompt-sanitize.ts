/**
 * Prompt Sanitization Utilities
 * 
 * Prevents prompt injection by sanitizing untrusted input (RSS content)
 * before interpolation into AI prompts.
 */

/** Tokens that could be used for prompt injection / role hijacking */
const ROLE_TOKENS = [
    'SYSTEM:', 'DEVELOPER:', 'ASSISTANT:', 'USER:',
    '### Instruction', '### Response',
    '<<SYS>>', '<</SYS>>', '<<INST>>', '<</INST>>',
    '[INST]', '[/INST]',
];

/** Patterns to strip from untrusted input */
const STRIP_PATTERNS: RegExp[] = [
    /```[\s\S]*?```/g,          // code fences
    /<script[\s\S]*?<\/script>/gi, // script tags
    /<!--[\s\S]*?-->/g,         // HTML comments
    /\{%[\s\S]*?%\}/g,         // template tags
];

/**
 * Sanitize untrusted text before inserting into an AI prompt.
 * 
 * Rules:
 * 1. Remove non-printable / control characters (keep newlines/tabs as spaces)
 * 2. Strip code fences, script tags, HTML comments, template tags
 * 3. Remove role/instruction tokens that could hijack the prompt
 * 4. Collapse repeated whitespace
 * 5. Hard truncate to maxLen
 */
export function sanitizeForPrompt(input: string, maxLen: number): string {
    if (!input) return '';

    let s = input;

    // 1. Remove non-printable control chars (keep space, newline, tab → will collapse later)
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Strip dangerous patterns
    for (const pattern of STRIP_PATTERNS) {
        s = s.replace(pattern, ' ');
    }

    // 3. Remove role tokens (case-insensitive)
    for (const token of ROLE_TOKENS) {
        // Escape special regex chars in token
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(escaped, 'gi'), '');
    }

    // 4. Remove << >> angle brackets used in prompt injection
    s = s.replace(/<<|>>/g, '');

    // 5. Remove ### (markdown heading injection)
    s = s.replace(/#{3,}/g, '');

    // 6. Collapse all whitespace (newlines, tabs, multiple spaces) to single space
    s = s.replace(/\s+/g, ' ').trim();

    // 7. Hard truncate
    if (s.length > maxLen) {
        s = s.slice(0, maxLen);
    }

    return s;
}

/**
 * Wrap untrusted text in clearly-labeled delimiters.
 * These delimiters help the AI model distinguish between
 * instructions and untrusted data.
 */
export function wrapUntrustedBlock(label: string, text: string): string {
    const tag = `UNTRUSTED_${label.toUpperCase()}`;
    return `<${tag}>\n${text}\n</${tag}>`;
}
