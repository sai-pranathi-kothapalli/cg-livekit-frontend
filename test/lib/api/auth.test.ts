import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/api/client';
import { login, adminLogin, studentRegister, studentLogin, changePassword, resetPassword } from '@/lib/api/auth';

// Mock the client module
vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        saveAuthToken: vi.fn(),
        saveUserData: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
    };
});

describe('Auth API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('login saves token and user data on success', async () => {
        const mockResponse = {
            success: true,
            token: 'test-token',
            user: { id: 1, role: 'student' }
        };
        vi.mocked(client.apiRequest).mockResolvedValueOnce(mockResponse);

        const result = await login({ username: 'test', password: 'password' });

        expect(result).toEqual(mockResponse);
        expect(client.saveAuthToken).toHaveBeenCalledWith('test-token');
        expect(client.saveUserData).toHaveBeenCalledWith(mockResponse.user);
    });

    it('adminLogin saves token and constructs user data', async () => {
        const mockResponse = {
            success: true,
            token: 'admin-token'
        };
        vi.mocked(client.apiRequest).mockResolvedValueOnce(mockResponse);

        const result = await adminLogin({ username: 'admin', password: 'password' });

        expect(result).toEqual(mockResponse);
        expect(client.saveAuthToken).toHaveBeenCalledWith('admin-token');
        expect(client.saveUserData).toHaveBeenCalledWith({ role: 'admin', username: 'admin' });
    });

    it('studentRegister saves token and user data', async () => {
        const mockResponse = {
            success: true,
            token: 'reg-token',
            user: { id: 2, role: 'student' }
        };
        vi.mocked(client.apiRequest).mockResolvedValueOnce(mockResponse);

        const result = await studentRegister({
            name: 'New Student',
            email: 'test@test.com',
            password: 'pass',
            phone: '123',
            college: 'Test College',
            branch: 'CS',
            year: '4'
        });

        expect(result).toEqual(mockResponse);
        expect(client.saveAuthToken).toHaveBeenCalledWith('reg-token');
        expect(client.saveUserData).toHaveBeenCalledWith(mockResponse.user);
    });

    it('studentLogin maps email to username and saves token', async () => {
        const mockResponse = {
            success: true,
            token: 'login-token',
            user: { id: 3, role: 'student' }
        };
        vi.mocked(client.apiRequest).mockResolvedValueOnce(mockResponse);

        const result = await studentLogin({ email: 's@s.com', password: 'p' });

        expect(result).toEqual(mockResponse);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/login'),
            expect.objectContaining({
                body: JSON.stringify({ username: 's@s.com', password: 'p' })
            })
        );
    });

    it('resetPassword makes a POST request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true, message: 'Reset link sent' });

        const result = await resetPassword({ email: 'test@test.com' });

        expect(result.success).toBe(true);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/reset-password'),
            expect.any(Object)
        );
    });

    it('changePassword uses auth headers', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });

        await changePassword({ old_password: 'old', new_password: 'new' });

        expect(client.getAuthHeaders).toHaveBeenCalled();
    });
});
