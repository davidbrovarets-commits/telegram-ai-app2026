/**
 * Model Router — Deterministic task-based model selection with fallback.
 *
 * Routes AI tasks to the optimal model while guaranteeing a fallback path.
 * No heuristics, no oscillation — pure deterministic rules.
 */

import { getAI, VertexAIBackend, getGenerativeModel, GenerativeModel } from 'firebase/ai';
import { app } from '../../firebaseConfig';
import { MODEL_CONFIG, type ModelDef } from './model-config';

export type TaskType = 'UNDERSTAND_DOC' | 'DECIDE_ACTIONS';

export interface RouteResult {
    primary: ModelDef;
    fallback: ModelDef;
}

export interface ModelCallResult {
    text: string;
    modelUsed: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
}

/**
 * Deterministic routing rules.
 * When router is disabled, all tasks use GEMINI_FALLBACK.
 */
export function routeForTask(taskType: TaskType): RouteResult {
    if (!MODEL_CONFIG.ROUTER_ENABLED) {
        return {
            primary: MODEL_CONFIG.GEMINI_FALLBACK,
            fallback: MODEL_CONFIG.GEMINI_FALLBACK,
        };
    }

    switch (taskType) {
        case 'UNDERSTAND_DOC':
            return {
                primary: MODEL_CONFIG.GEMINI_PRIMARY,
                fallback: MODEL_CONFIG.GEMINI_FALLBACK,
            };
        case 'DECIDE_ACTIONS':
            return {
                primary: MODEL_CONFIG.GLM_DECISION,
                fallback: MODEL_CONFIG.GEMINI_FALLBACK,
            };
        default:
            return {
                primary: MODEL_CONFIG.GEMINI_FALLBACK,
                fallback: MODEL_CONFIG.GEMINI_FALLBACK,
            };
    }
}

/**
 * Create a GenerativeModel instance for a given model definition.
 */
function createModel(modelDef: ModelDef): GenerativeModel {
    const ai = getAI(app, {
        backend: new VertexAIBackend(modelDef.location),
    });

    return getGenerativeModel(ai, {
        model: modelDef.id,
        safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
        ],
    });
}

/**
 * Execute a prompt against the routed model with automatic fallback.
 *
 * Flow:
 * 1. Try primary model
 * 2. On failure (PERMISSION_DENIED, NOT_FOUND, 404, RESOURCE_EXHAUSTED, parse error) → try fallback
 * 3. On fallback failure → throw (caller handles)
 */
export async function invokeWithFallback(
    taskType: TaskType,
    contentParts: Array<string | { inlineData: { data: string; mimeType: string } }>,
): Promise<ModelCallResult> {
    const route = routeForTask(taskType);

    // --- Try primary ---
    try {
        const model = createModel(route.primary);
        console.log('[MODEL_RUNTIME_CALL]', JSON.stringify({
            model: route.primary.id,
            location: route.primary.location,
            task: taskType,
            timestamp: new Date().toISOString(),
        }));
        const result = await model.generateContent(contentParts);
        const text = result.response.text();

        if (!text) throw new Error('Empty response from primary model');

        console.log(`[ModelRouter] ${taskType} success on primary: ${route.primary.id}`);
        return {
            text,
            modelUsed: route.primary.id,
            fallbackUsed: false,
        };
    } catch (primaryError: any) {
        const msg = primaryError.message || String(primaryError);
        const isFallbackWorthy =
            msg.includes('404') ||
            msg.includes('NOT_FOUND') ||
            msg.includes('UNIMPLEMENTED') ||
            msg.includes('PERMISSION_DENIED') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('403') ||
            msg.includes('429') ||
            msg.includes('model not found') ||
            msg.includes('is not supported');

        if (!isFallbackWorthy) {
            // Non-retryable error (safety block, etc.) — don't waste fallback
            console.error(`[ModelRouter] ${taskType} non-retryable error on ${route.primary.id}:`, msg);
            throw primaryError;
        }

        console.warn('[MODEL_FALLBACK_TRIGGERED]', JSON.stringify({
            primary_model: route.primary.id,
            fallback_model: route.fallback.id,
            task: taskType,
            reason: msg.slice(0, 200),
            timestamp: new Date().toISOString(),
        }));

        // --- Try fallback ---
        // If primary === fallback (router disabled or same model), don't retry
        if (route.primary.id === route.fallback.id) {
            throw primaryError;
        }

        try {
            const fallbackModel = createModel(route.fallback);
            console.log('[MODEL_RUNTIME_CALL]', JSON.stringify({
                model: route.fallback.id,
                location: route.fallback.location,
                task: taskType,
                is_fallback: true,
                timestamp: new Date().toISOString(),
            }));
            const fallbackResult = await fallbackModel.generateContent(contentParts);
            const fallbackText = fallbackResult.response.text();

            if (!fallbackText) throw new Error('Empty response from fallback model');

            console.log(`[ModelRouter] ${taskType} success on fallback: ${route.fallback.id}`);
            return {
                text: fallbackText,
                modelUsed: route.fallback.id,
                fallbackUsed: true,
                fallbackReason: msg.slice(0, 200),
            };
        } catch (fallbackError: any) {
            console.error(`[ModelRouter] ${taskType} both primary and fallback failed.`);
            throw fallbackError;
        }
    }
}
