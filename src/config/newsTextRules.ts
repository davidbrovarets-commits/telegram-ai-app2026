/**
 * NEWS TEXT RULES — Single Source of Truth (SSOT)
 *
 * All editorial word-based limits for news text fields.
 * Every layer (prompt, runtime validation, UI) must import from here.
 * No other file should define these numbers.
 *
 * CR-007: Word-Based Normalization
 */

export const NEWS_TEXT_RULES = {
    title: {
        minWords: 7,
        maxWords: 10,
        requireFullSentence: true,
    },
    feedSummary: {
        minWords: 30,
        maxWords: 45,
    },
    detailContent: {
        minWords: 300,
        maxWords: 400,
    },
} as const;

export type NewsTextRules = typeof NEWS_TEXT_RULES;
