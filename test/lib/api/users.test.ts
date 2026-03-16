import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/api/client';
import {
    enrollUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    bulkEnrollUsers
} from '@/lib/api/users';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
        getAuthToken: vi.fn(() => 'test-token'),
    };
});

describe('Users API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('enrollUser makes a POST request', async () => {
        const data = { email: 't@t.com', name: 'T' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ id: '1' });
        await enrollUser(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
        );
    });

    it('getAllUsers calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getAllUsers();
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/'),
            expect.any(Object)
        );
    });

    it('getUser calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getUser('123');
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/123'),
            expect.any(Object)
        );
    });

    it('updateUser makes a PUT request', async () => {
        const data = { name: 'U' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await updateUser('123', data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/123'),
            expect.objectContaining({ method: 'PUT', body: JSON.stringify(data) })
        );
    });

    it('deleteUser makes a DELETE request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await deleteUser('123');
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/123'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    it('bulkEnrollUsers uses FormData', async () => {
        const file = new File([''], 'u.csv');
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await bulkEnrollUsers(file);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/bulk-enroll'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
                body: expect.any(FormData)
            })
        );
    });
});
