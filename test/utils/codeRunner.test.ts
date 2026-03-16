import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCode } from '@/utils/codeRunner';

vi.mock('@/lib/debug', () => ({
    debug: {
        log: vi.fn(),
        error: vi.fn(),
    }
}));

describe('codeRunner', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
        vi.clearAllMocks();
    });

    it('executes code successfully and returns stdout', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ stdout: 'Hello World', stderr: '' })
        } as Response);

        const result = await runCode('print("Hello World")', 'python');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/compiler/execute'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ language: 'python', code: 'print("Hello World")', stdin: '' })
            })
        );
        expect(result.output).toBe('Hello World');
        expect(result.error).toBeUndefined();
        expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('handles compilation/execution errors with stderr', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ stdout: '', stderr: 'SyntaxError: invalid syntax' })
        } as Response);

        const result = await runCode('prnt("Hi")', 'python');

        expect(result.output).toBe('');
        expect(result.error).toBe('SyntaxError: invalid syntax');
    });

    it('handles HTTP errors from the backend', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({ detail: 'Invalid language' })
        } as Response);

        const result = await runCode('code', 'unknown');

        expect(result.error).toBe('Invalid language');
    });

    it('handles network failures', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network offline'));

        const result = await runCode('code', 'python');

        expect(result.error).toBe('Network offline');
    });

    it('handles HTTP error with no JSON detail', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 502,
            statusText: 'Bad Gateway',
            json: async () => { throw new Error('Not JSON'); }
        } as Response);

        const result = await runCode('code', 'python');

        // The try/catch around response.json() falls back to either data.detail or response.statusText
        expect(result.error).toBe('Bad Gateway');
    });

    it('handles successful execution with no stderr', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ stdout: 'Success', stderr: null })
        } as Response);

        const result = await runCode('code', 'python');

        expect(result.output).toBe('Success');
        expect(result.error).toBeUndefined();
    });
});
