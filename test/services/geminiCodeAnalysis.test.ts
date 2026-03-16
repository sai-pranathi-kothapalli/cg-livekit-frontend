import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeCode } from '@/services/geminiCodeAnalysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI library
vi.mock('@google/generative-ai', () => {
    const mockModel = {
        generateContent: vi.fn()
    };
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel() {
                return mockModel;
            }
        }
    };
});


// Mock the debug utility
vi.mock('@/lib/debug', () => ({
    debug: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('geminiCodeAnalysis service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns an error message when API_KEY is missing/placeholder', async () => {
        // The implementation has a peculiar check for this
        // It first defines API_KEY = import.meta.env.VITE_GEMINI_API_KEY
        // Then checks if it's missing or 'your_gemini_api_key_here'
        // But note the implementation logic in lines 15-18 has a bug where it returns inside the if block
        vi.stubEnv('VITE_GEMINI_API_KEY', 'your_gemini_api_key_here');

        const result = await analyzeCode('Test Problem', 'const x = 1;', 'javascript');
        expect(result).toBe('AI analysis failed: Please set a valid VITE_GEMINI_API_KEY in your .env file.');
    });

    it('returns an error if API_KEY is undefined', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', ''); // Empty is falsy
        const result = await analyzeCode('Test Problem', 'const x = 1;', 'javascript');
        expect(result).toBe('AI analysis failed: Please set a valid VITE_GEMINI_API_KEY in your .env file.');
    });

    it('analyzes code successfully', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'valid-api-key');

        const mockResponseText = '1. Correctness: Yes. 2. Quality: Good. 3. Complexity: O(1). 4. Verdict: Pass';

        // Setup the mock chain to return a successful response
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const mockModel = new GoogleGenerativeAI('temp').getGenerativeModel({ model: 'temp' });

        // @ts-expect-error mocking
        mockModel.generateContent.mockResolvedValueOnce({
            response: Promise.resolve({
                text: () => mockResponseText
            })
        });

        const result = await analyzeCode('Write a function', 'function() {}', 'javascript');
        expect(result).toBe(mockResponseText);
        // @ts-expect-error mocking
        expect(mockModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('Write a function'));
    });

    it('handles empty response from Gemini', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'valid-api-key');

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const mockModel = new GoogleGenerativeAI('temp').getGenerativeModel({ model: 'temp' });

        // @ts-expect-error mocking
        mockModel.generateContent.mockResolvedValueOnce({
            response: Promise.resolve({
                text: () => '' // Empty text triggers the error block on line 49
            })
        });

        const result = await analyzeCode('Question', 'Code', 'Python');
        expect(result).toContain('Code analysis temporarily unavailable');
        expect(result).toContain('Empty response from Gemini');
    });

    it('handles API errors from Gemini', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'valid-api-key');

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const mockModel = new GoogleGenerativeAI('temp').getGenerativeModel({ model: 'temp' });

        // @ts-expect-error mocking
        mockModel.generateContent.mockRejectedValueOnce(new Error('Rate limit exceeded'));

        const result = await analyzeCode('Question', 'Code', 'Python');
        expect(result).toContain('Code analysis temporarily unavailable');
        expect(result).toContain('Rate limit exceeded');
    });

    it('handles GoogleGenerativeAI initialization errors', async () => {
        vi.stubEnv('VITE_GEMINI_API_KEY', 'valid-api-key');

        // Override the mock to throw when instantiating using a doMock specifically for this test
        vi.resetModules();
        vi.doMock('@google/generative-ai', () => ({
            GoogleGenerativeAI: class {
                constructor() {
                    throw new Error('SDK Init Crash');
                }
            }
        }));

        const { analyzeCode: analyzeDynamic } = await import('@/services/geminiCodeAnalysis');
        const result = await analyzeDynamic('Question', 'Code', 'Python');

        expect(result).toContain('AI analysis initialization failed');
        expect(result).toContain('SDK Init Crash');
    });

});
