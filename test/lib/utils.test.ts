import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
    // Set these before the module is imported
    vi.stubEnv('VITE_APP_CONFIG_ENDPOINT', 'http://test.com/config');
    vi.stubEnv('VITE_SANDBOX_ID', 'test-sandbox');
});

import { cn, getStyles, getAppConfig, getSandboxTokenSource } from '@/lib/utils';
import { APP_CONFIG_DEFAULTS } from '@/app-config';

// Mock livekit-client
vi.mock('livekit-client', () => ({
    TokenSource: {
        custom: vi.fn((fn) => ({ _fn: fn })),
    }
}));

describe('utils', () => {
    describe('cn utility', () => {
        it('combines class names correctly', () => {
            expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
        });

        it('handles conditional classes', () => {
            expect(cn('btn', true && 'btn-active', false && 'btn-disabled')).toBe('btn btn-active');
        });

        it('merges tailwind classes correctly', () => {
            expect(cn('p-4 p-8')).toBe('p-8');
        });

        it('handles undefined and null', () => {
            expect(cn('btn', undefined, null)).toBe('btn');
        });
    });

    describe('getStyles', () => {
        it('returns empty string when no colors are provided', () => {
            const config = { ...APP_CONFIG_DEFAULTS, accent: '', accentDark: '' };
            expect(getStyles(config)).toBe('');
        });

        it('returns CSS variables when accent color is provided', () => {
            const config = { ...APP_CONFIG_DEFAULTS, accent: '#ff0000' };
            const styles = getStyles(config);
            expect(styles).toContain('--primary: #ff0000');
        });
    });

    describe('getAppConfig', () => {
        beforeEach(() => {
            vi.stubGlobal('fetch', vi.fn());
        });

        it('returns defaults when no endpoint is configured', async () => {
            // Note: CONFIG_ENDPOINT is imported at top level, so it might be tricky to mock if already set
            // But we can check if it returns something
            const result = await getAppConfig(null);
            expect(result).toEqual(APP_CONFIG_DEFAULTS);
        });

        it('fetches remote config when endpoint is set', async () => {
            const mockResponse = {
                companyName: { type: 'string', value: 'Test Company' },
                startButtonText: { type: 'string', value: 'Start Testing' }
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            } as Response);

            const result = await getAppConfig(null);

            expect(fetch).toHaveBeenCalledWith('http://test.com/config', expect.any(Object));
            expect(result.companyName).toBe('Test Company');
            expect(result.startButtonText).toBe('Start Testing');
            // Should preserve defaults for other fields
            expect(result.pageTitle).toBe(APP_CONFIG_DEFAULTS.pageTitle);
        });

        it('returns defaults on fetch error', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            const result = await getAppConfig(null);
            expect(result).toEqual(APP_CONFIG_DEFAULTS);
        });

        it('returns defaults when Sandbox ID is missing', async () => {
            // Mock console.error to avoid noise in the output
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            vi.stubEnv('VITE_SANDBOX_ID', '');
            vi.resetModules();

            // Re-import the module to pick up the new env values for its constants
            const { getAppConfig: getAppConfigDynamic } = await import('@/lib/utils');

            const result = await getAppConfigDynamic(null);
            expect(result).toEqual(APP_CONFIG_DEFAULTS);

            errorSpy.mockRestore();
        });

        it('logs error on non-ok response', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            } as Response);

            const result = await getAppConfig(null);
            expect(result).toEqual(APP_CONFIG_DEFAULTS);
        });
    });

    describe('getSandboxTokenSource', () => {
        beforeEach(() => {
            vi.stubGlobal('fetch', vi.fn());
            vi.stubEnv('VITE_CONN_DETAILS_ENDPOINT', '/api/conn');
            // Mock window.location
            vi.stubGlobal('location', { origin: 'http://localhost:3000' });
        });

        it('creates a custom token source that fetches connection details', async () => {
            const mockConnDetails = { serverUrl: 'ws://test', token: 'test-token' };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockConnDetails,
            } as Response);

            const source = getSandboxTokenSource({ ...APP_CONFIG_DEFAULTS, sandboxId: 'sb-123' });
            // @ts-expect-error accessing private property for testing
            const result = await source._fn();

            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3000/api/conn',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({ 'X-Sandbox-Id': 'sb-123' })
                })
            );
            expect(result).toEqual(mockConnDetails);
        });

        it('throws error on fetch failure', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Fetch failed'));

            const source = getSandboxTokenSource(APP_CONFIG_DEFAULTS);

            // @ts-expect-error accessing private property for testing
            await expect(source._fn()).rejects.toThrow('Error fetching connection details!');
        });
    });
});
