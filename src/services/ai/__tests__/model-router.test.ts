/**
 * Model Router Tests
 *
 * Tests routing logic and fallback behavior using mocked Firebase AI.
 * No real Vertex AI calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted mocks (vitest hoists vi.mock to top of file) ---
const { mockGenerateContent, mockGetGenerativeModel, mockConfig } = vi.hoisted(() => {
    const mockGenerateContent = vi.fn();
    const mockGetGenerativeModel = vi.fn(() => ({
        generateContent: mockGenerateContent,
    }));

    const mockConfig = {
        GEMINI_PRIMARY: { id: 'gemini-2.5-pro', location: 'global' },
        GEMINI_FALLBACK: { id: 'gemini-2.5-pro', location: 'us-central1' },
        GLM_DECISION: { id: 'glm-4.7', location: 'us-central1' },
        ROUTER_ENABLED: true,
    };

    return { mockGenerateContent, mockGetGenerativeModel, mockConfig };
});

vi.mock('firebase/ai', () => {
    // VertexAIBackend must be a real class (used with `new`)
    class MockVertexAIBackend {
        location: string;
        constructor(location: string) {
            this.location = location;
        }
    }
    return {
        getAI: vi.fn(() => ({})),
        getGenerativeModel: (...args: any[]) => mockGetGenerativeModel(...args),
        VertexAIBackend: MockVertexAIBackend,
    };
});

vi.mock('../../../firebaseConfig', () => ({
    app: {},
}));

vi.mock('../model-config', () => ({
    MODEL_CONFIG: mockConfig,
}));

import { routeForTask, invokeWithFallback } from '../model-router';

describe('routeForTask', () => {
    it('picks gemini-2.5-pro for UNDERSTAND_DOC', () => {
        mockConfig.ROUTER_ENABLED = true;
        const route = routeForTask('UNDERSTAND_DOC');
        expect(route.primary.id).toBe('gemini-2.5-pro');
        expect(route.primary.location).toBe('global');
        expect(route.fallback.id).toBe('gemini-2.5-pro');
    });

    it('picks glm-4.7 for DECIDE_ACTIONS', () => {
        mockConfig.ROUTER_ENABLED = true;
        const route = routeForTask('DECIDE_ACTIONS');
        expect(route.primary.id).toBe('glm-4.7');
        expect(route.fallback.id).toBe('gemini-2.5-pro');
    });

    it('uses fallback for all tasks when router disabled', () => {
        mockConfig.ROUTER_ENABLED = false;
        const route1 = routeForTask('UNDERSTAND_DOC');
        const route2 = routeForTask('DECIDE_ACTIONS');
        expect(route1.primary.id).toBe('gemini-2.5-pro');
        expect(route2.primary.id).toBe('gemini-2.5-pro');
        // Restore
        mockConfig.ROUTER_ENABLED = true;
    });
});

describe('invokeWithFallback', () => {
    beforeEach(() => {
        mockGenerateContent.mockReset();
        mockGetGenerativeModel.mockClear();
        mockConfig.ROUTER_ENABLED = true;
    });

    it('returns primary model result on success', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => 'hello from primary' },
        });

        const result = await invokeWithFallback('UNDERSTAND_DOC', ['test prompt']);
        expect(result.text).toBe('hello from primary');
        expect(result.modelUsed).toBe('gemini-2.5-pro');
        expect(result.fallbackUsed).toBe(false);
    });

    it('falls back on PERMISSION_DENIED from primary', async () => {
        mockGenerateContent
            .mockRejectedValueOnce(new Error('403 PERMISSION_DENIED'))
            .mockResolvedValueOnce({
                response: { text: () => 'hello from fallback' },
            });

        const result = await invokeWithFallback('UNDERSTAND_DOC', ['test prompt']);
        expect(result.text).toBe('hello from fallback');
        expect(result.modelUsed).toBe('gemini-2.5-pro');
        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toContain('PERMISSION_DENIED');
    });

    it('falls back on RESOURCE_EXHAUSTED from GLM', async () => {
        mockGenerateContent
            .mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'))
            .mockResolvedValueOnce({
                response: { text: () => 'decided by fallback' },
            });

        const result = await invokeWithFallback('DECIDE_ACTIONS', ['test prompt']);
        expect(result.text).toBe('decided by fallback');
        expect(result.modelUsed).toBe('gemini-2.5-pro');
        expect(result.fallbackUsed).toBe(true);
        expect(result.fallbackReason).toContain('RESOURCE_EXHAUSTED');
    });

    it('throws when both primary and fallback fail', async () => {
        mockGenerateContent
            .mockRejectedValueOnce(new Error('404 NOT_FOUND'))
            .mockRejectedValueOnce(new Error('500 Internal Error'));

        await expect(
            invokeWithFallback('UNDERSTAND_DOC', ['test prompt'])
        ).rejects.toThrow('500 Internal Error');
    });

    it('does not retry on non-retryable errors (safety block)', async () => {
        mockGenerateContent
            .mockRejectedValueOnce(new Error('safety block'));

        await expect(
            invokeWithFallback('UNDERSTAND_DOC', ['test prompt'])
        ).rejects.toThrow('safety block');

        // Should NOT have attempted fallback (only 1 call)
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
});
