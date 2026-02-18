/**
 * Model Configuration — Central registry for AI model IDs and locations.
 *
 * All model routing decisions reference this config.
 * Feature flag MODEL_ROUTER_ENABLED gates the multi-model pipeline;
 * when false, everything falls back to GEMINI_FALLBACK (gemini-2.5-pro).
 */

export interface ModelDef {
    id: string;
    location: string;
}

export const MODEL_CONFIG = {
    /** Primary document understanding model */
    GEMINI_PRIMARY: {
        id: import.meta.env.VITE_MODEL_GEMINI_PRIMARY || 'gemini-3-pro-preview',
        location: import.meta.env.VITE_MODEL_LOCATION_GEMINI_PRIMARY || 'global',
    } as ModelDef,

    /** Fallback model (proven stable) */
    GEMINI_FALLBACK: {
        id: import.meta.env.VITE_MODEL_GEMINI_FALLBACK || 'gemini-2.5-pro',
        location: import.meta.env.VITE_MODEL_LOCATION_DEFAULT || 'us-central1',
    } as ModelDef,

    /** Decision / action plan model */
    GLM_DECISION: {
        id: import.meta.env.VITE_MODEL_GLM_DECISION || 'glm-4.7',
        location: import.meta.env.VITE_MODEL_LOCATION_DEFAULT || 'us-central1',
    } as ModelDef,

    /** Feature flag: when false, all calls use GEMINI_FALLBACK */
    ROUTER_ENABLED: import.meta.env.VITE_MODEL_ROUTER_ENABLED === 'true',
} as const;
