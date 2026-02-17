export const limits = {
    // Article Caps
    MAX_ARTICLES_PER_RUN_TOTAL: Number(process.env.LIMIT_MAX_ARTICLES_TOTAL || 30),
    MAX_ARTICLES_PER_SCOPE: {
        COUNTRY: Number(process.env.LIMIT_MAX_ARTICLES_COUNTRY || 8),
        BUNDESLAND: Number(process.env.LIMIT_MAX_ARTICLES_BUNDESLAND || 6),
        CITY: Number(process.env.LIMIT_MAX_ARTICLES_CITY || 4)
    },

    // AI / Cost Caps
    MAX_AI_CALLS_PER_RUN: Number(process.env.LIMIT_MAX_AI_CALLS || 40),
    MAX_IMAGE_GENS_PER_RUN: Number(process.env.LIMIT_MAX_IMAGE_GENS || 10),
    MAX_TOKENS_PER_ARTICLE: Number(process.env.LIMIT_MAX_TOKENS_PER_ARTICLE || 900),

    // Timeouts
    AI_REQUEST_TIMEOUT_MS: Number(process.env.LIMIT_AI_TIMEOUT_MS || 45000),
    IMAGEN_REQUEST_TIMEOUT_MS: Number(process.env.LIMIT_IMAGEN_TIMEOUT_MS || 60000),
};

export function getLimit(key: keyof typeof limits, fallback?: number): number {
    return Number(limits[key]) || fallback || 0;
}
