/**
 * Document Analysis Service — Two-step structured analysis pipeline.
 *
 * Step 1 (UNDERSTAND_DOC): Extract entities, dates, amounts from document
 * Step 2 (DECIDE_ACTIONS): Generate action plan based on extracted data
 *
 * Both steps enforce strict JSON output with post-parse validation.
 * Falls back gracefully on parse failures and model errors.
 */

import { invokeWithFallback, type ModelCallResult } from './model-router';

// ─── JSON Schema Types ────────────────────────────────────────────

export interface DocumentAnalysisResult {
    doc_type: 'jobcenter' | 'auslaenderbehoerde' | 'court' | 'other';
    language: 'de' | 'ru' | 'uk' | 'other';
    summary: string;
    key_entities: {
        person_names: string[];
        case_numbers: string[];
        amounts: Array<{ value: string; currency: string; context: string }>;
        deadlines: Array<{ date: string; context: string; risk: 'low' | 'medium' | 'high' }>;
    };
    required_actions: Array<{
        action: string;
        who: 'user' | 'authority' | 'unknown';
        when: string;
        priority: 'P0' | 'P1' | 'P2';
    }>;
    risks: Array<{ risk: string; severity: 'low' | 'medium' | 'high'; why: string }>;
    model_trace: {
        understand_model: string;
        decide_model: string;
        fallbacks: Array<{ step: 'understand' | 'decide'; from: string; to: string; reason: string }>;
    };
}

// ─── Prompts ──────────────────────────────────────────────────────

const UNDERSTAND_PROMPT = `You are a Document Analysis AI. Analyze the provided document image.

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no explanations, no code fences.
- Follow this EXACT schema:

{
  "doc_type": "jobcenter|auslaenderbehoerde|court|other",
  "language": "de|ru|uk|other",
  "summary": "Brief summary of the document in Ukrainian",
  "key_entities": {
    "person_names": ["string"],
    "case_numbers": ["string"],
    "amounts": [{"value": "string", "currency": "EUR", "context": "what this amount is for"}],
    "deadlines": [{"date": "YYYY-MM-DD", "context": "what this deadline is for", "risk": "low|medium|high"}]
  }
}

RULES:
- Extract ALL dates, names, case numbers, monetary amounts.
- If a date is ambiguous, use ISO format and note uncertainty in context.
- "risk" for deadlines: high = <7 days from now, medium = 7-30 days, low = >30 days.
- If no entities found for a category, return an empty array.
- Do NOT invent data. If unsure, omit.`;

const DECIDE_PROMPT = `You are a Legal Action Advisor AI. Based on the document analysis below, determine required actions and risks.

DOCUMENT ANALYSIS:
{UNDERSTAND_RESULT}

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no explanations, no code fences.
- Follow this EXACT schema:

{
  "required_actions": [
    {"action": "description of action needed", "who": "user|authority|unknown", "when": "YYYY-MM-DD|unknown", "priority": "P0|P1|P2"}
  ],
  "risks": [
    {"risk": "description of risk", "severity": "low|medium|high", "why": "explanation"}
  ]
}

RULES:
- P0 = immediate/urgent (deadline within 7 days or legal consequence).
- P1 = important (deadline within 30 days).
- P2 = informational (no immediate deadline).
- If the document requires a response, "who" = "user".
- If the document is informational only (e.g. receipt, confirmation), return empty actions array.
- Do NOT invent actions that aren't supported by the document.`;

const JSON_RETRY_SUFFIX = `

CRITICAL: Your previous response was not valid JSON. You MUST return ONLY a JSON object. 
No markdown. No code fences. No explanations. Start with { and end with }.`;

// ─── Core Pipeline ────────────────────────────────────────────────

/**
 * Safe JSON parse with cleanup (strips markdown fences, leading text).
 */
function safeParseJSON<T>(text: string): T | null {
    try {
        // Strip markdown code fences if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        // Find first { and last } — extract JSON object
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;
        cleaned = cleaned.slice(start, end + 1);

        return JSON.parse(cleaned) as T;
    } catch {
        return null;
    }
}

/**
 * Validate the UNDERSTAND step output has required fields.
 */
function validateUnderstandResult(obj: any): boolean {
    return (
        obj &&
        typeof obj.doc_type === 'string' &&
        typeof obj.language === 'string' &&
        typeof obj.summary === 'string' &&
        obj.key_entities &&
        Array.isArray(obj.key_entities.person_names) &&
        Array.isArray(obj.key_entities.case_numbers) &&
        Array.isArray(obj.key_entities.amounts) &&
        Array.isArray(obj.key_entities.deadlines)
    );
}

/**
 * Validate the DECIDE step output has required fields.
 */
function validateDecideResult(obj: any): boolean {
    return (
        obj &&
        Array.isArray(obj.required_actions) &&
        Array.isArray(obj.risks)
    );
}

/**
 * Execute a step with JSON retry logic.
 * If first attempt returns non-JSON, retry once with stronger instruction.
 * If retry also fails, attempt on fallback model.
 */
async function executeStepWithRetry(
    taskType: 'UNDERSTAND_DOC' | 'DECIDE_ACTIONS',
    prompt: string,
    imageParts: Array<string | { inlineData: { data: string; mimeType: string } }>,
    validator: (obj: any) => boolean,
): Promise<{ data: any; callResult: ModelCallResult }> {
    // Attempt 1: normal prompt
    const contentParts = [...imageParts, prompt];
    let callResult = await invokeWithFallback(taskType, contentParts);

    let parsed = safeParseJSON(callResult.text);
    if (parsed && validator(parsed)) {
        return { data: parsed, callResult };
    }

    // Attempt 2: retry with stronger JSON instruction
    console.warn(`[DocAnalysis] ${taskType} returned invalid JSON, retrying with strict instruction`);
    const retryParts = [...imageParts, prompt + JSON_RETRY_SUFFIX];
    callResult = await invokeWithFallback(taskType, retryParts);

    parsed = safeParseJSON(callResult.text);
    if (parsed && validator(parsed)) {
        return { data: parsed, callResult };
    }

    throw new Error(`${taskType}: failed to get valid JSON after retries (model: ${callResult.modelUsed})`);
}

/**
 * Run the full two-step document analysis pipeline.
 *
 * @param imageUrl — data: URI or fetchable URL of the document image
 * @returns Structured DocumentAnalysisResult with model_trace
 */
export async function analyzeDocumentStructured(
    imageUrl: string,
): Promise<DocumentAnalysisResult> {
    // --- Prepare image data ---
    let inlineData: { inlineData: { data: string; mimeType: string } };

    if (imageUrl.startsWith('data:')) {
        const base64 = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        inlineData = { inlineData: { data: base64, mimeType } };
    } else {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        const realBase64 = base64.split(',')[1];
        inlineData = { inlineData: { data: realBase64, mimeType: blob.type } };
    }

    const fallbacks: DocumentAnalysisResult['model_trace']['fallbacks'] = [];

    // --- Step 1: UNDERSTAND_DOC ---
    let understandData: any;
    let understandModel: string;

    try {
        const step1 = await executeStepWithRetry(
            'UNDERSTAND_DOC',
            UNDERSTAND_PROMPT,
            [inlineData],
            validateUnderstandResult,
        );
        understandData = step1.data;
        understandModel = step1.callResult.modelUsed;

        if (step1.callResult.fallbackUsed) {
            fallbacks.push({
                step: 'understand',
                from: 'gemini-3-pro-preview',
                to: step1.callResult.modelUsed,
                reason: step1.callResult.fallbackReason || 'primary failed',
            });
        }
    } catch (e: any) {
        console.error('[DocAnalysis] UNDERSTAND_DOC failed completely:', e.message);
        return createErrorResult('UNDERSTAND_DOC failed: ' + e.message);
    }

    // --- Step 2: DECIDE_ACTIONS ---
    let decideData: any;
    let decideModel: string;

    try {
        const decidePrompt = DECIDE_PROMPT.replace('{UNDERSTAND_RESULT}', JSON.stringify(understandData, null, 2));

        const step2 = await executeStepWithRetry(
            'DECIDE_ACTIONS',
            decidePrompt,
            [],  // No image needed for decision step — text-only
            validateDecideResult,
        );
        decideData = step2.data;
        decideModel = step2.callResult.modelUsed;

        if (step2.callResult.fallbackUsed) {
            fallbacks.push({
                step: 'decide',
                from: 'glm-4.7',
                to: step2.callResult.modelUsed,
                reason: step2.callResult.fallbackReason || 'primary failed',
            });
        }
    } catch (e: any) {
        console.error('[DocAnalysis] DECIDE_ACTIONS failed completely:', e.message);
        // Still return understand data with empty actions
        decideData = { required_actions: [], risks: [] };
        decideModel = 'none (failed)';
        fallbacks.push({
            step: 'decide',
            from: 'glm-4.7',
            to: 'none',
            reason: e.message,
        });
    }

    // --- Merge results ---
    return {
        doc_type: understandData.doc_type || 'other',
        language: understandData.language || 'other',
        summary: understandData.summary || '',
        key_entities: understandData.key_entities || {
            person_names: [],
            case_numbers: [],
            amounts: [],
            deadlines: [],
        },
        required_actions: decideData.required_actions || [],
        risks: decideData.risks || [],
        model_trace: {
            understand_model: understandModel,
            decide_model: decideModel,
            fallbacks,
        },
    };
}

/**
 * Create a safe error result that the UI can still render.
 */
function createErrorResult(errorMessage: string): DocumentAnalysisResult {
    return {
        doc_type: 'other',
        language: 'other',
        summary: `Analysis error: ${errorMessage}`,
        key_entities: {
            person_names: [],
            case_numbers: [],
            amounts: [],
            deadlines: [],
        },
        required_actions: [],
        risks: [{ risk: 'Analysis failed', severity: 'high', why: errorMessage }],
        model_trace: {
            understand_model: 'error',
            decide_model: 'error',
            fallbacks: [],
        },
    };
}
