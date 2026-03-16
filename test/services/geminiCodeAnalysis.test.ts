import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeCode } from '@/services/geminiCodeAnalysis';

// Mock the debug utility
vi.mock('@/lib/debug', () => ({
    debug: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('geminiCodeAnalysis service', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = mockFetch;
        vi.stubEnv('VITE_API_URL', 'http://localhost:8000');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('analyzes code successfully via backend proxy', async () => {
        const mockResponseText = '1. Correctness: Yes. 2. Quality: Good. 3. Complexity: O(1). 4. Verdict: Pass';

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ feedback: mockResponseText })
        });

        const result = await analyzeCode('Write a function', 'function() {}', 'javascript');

        expect(result).toBe(mockResponseText);
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/interviews/analyze-code'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('Write a function')
            })
        );
    });

    it('handles HTTP errors from backend proxy', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const result = await analyzeCode('Question', 'Code', 'Python');
        expect(result).toBe('Code analysis temporarily unavailable.');
    });

    it('handles fetch network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await analyzeCode('Question', 'Code', 'Python');
        expect(result).toBe('Code analysis temporarily unavailable.');
    });

    it('handles invalid JSON response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => { throw new Error('Invalid JSON'); }
        });

        const result = await analyzeCode('Question', 'Code', 'Python');
        expect(result).toBe('Code analysis temporarily unavailable.');
    });
});
