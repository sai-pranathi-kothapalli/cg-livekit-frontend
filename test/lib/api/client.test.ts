import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getAuthToken,
    saveAuthToken,
    removeAuthToken,
    getAuthHeaders,
    saveUserData,
    getUserData,
    getUserRole,
    apiRequest,
    API_BASE_URL
} from '@/lib/api/client';

describe('API client', () => {
    beforeEach(() => {
        // Reset localStorage for each test
        localStorage.clear();
        vi.stubGlobal('fetch', vi.fn());
        vi.stubGlobal('dispatchEvent', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Auth Helpers', () => {
        it('saves and retrieves the auth token', () => {
            saveAuthToken('test-token');
            expect(getAuthToken()).toBe('test-token');
            expect(localStorage.getItem('authToken')).toBe('test-token');
        });

        it('removes the auth token and extra data', () => {
            saveAuthToken('test-token');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('userData', '{}');

            removeAuthToken();

            expect(getAuthToken()).toBeNull();
            expect(localStorage.getItem('userRole')).toBeNull();
            expect(localStorage.getItem('userData')).toBeNull();
        });

        it('generates headers with token', () => {
            saveAuthToken('token-123');
            const headers = getAuthHeaders() as any;
            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toBe('Bearer token-123');
        });

        it('can skip content-type in headers', () => {
            const headers = getAuthHeaders(true) as any;
            expect(headers['Content-Type']).toBeUndefined();
        });

        it('saves and retrieves user data', () => {
            const user = { name: 'Test', role: 'student' };
            saveUserData(user);
            expect(getUserData()).toEqual(user);
            expect(getUserRole()).toBe('student');
        });
    });

    describe('apiRequest', () => {
        it('returns JSON data on successful response', async () => {
            const mockData = { success: true };
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => mockData,
            } as Response);

            const result = await apiRequest('/api/test');
            expect(result).toEqual(mockData);
        });

        it('handles 401 Unauthorized by logging out', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                status: 401,
                ok: false,
                json: async () => ({ detail: 'Unauthorized' }),
            } as Response);

            saveAuthToken('old-token');

            await expect(apiRequest('/api/test')).rejects.toThrow('Unauthorized');

            expect(getAuthToken()).toBeNull();
            expect(dispatchEvent).toHaveBeenCalled();
        });

        it('throws error on non-ok responses', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Bad Request' }),
            } as Response);

            await expect(apiRequest('/api/test')).rejects.toThrow('Bad Request');
        });

        it('returns empty object if not JSON', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'text/plain' }),
            } as Response);

            const result = await apiRequest('/api/test');
            expect(result).toEqual({});
        });
    });
});
