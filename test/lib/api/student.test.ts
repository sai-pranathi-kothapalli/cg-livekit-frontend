import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.hoisted(() => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
});

import * as client from '@/lib/api/client';
import {
    getMyAssignments,
    selectSlot,
    getMyInterview,
    getApplicationForm,
    submitApplicationForm,
    uploadApplicationForm,
    getStudentAnalytics
} from '@/lib/api/student';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({ 'Content-Type': 'application/json' })),
        getAuthToken: vi.fn(() => 'test-token'),
    };
});

describe('Student API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getMyAssignments calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getMyAssignments();
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/my-assignments'),
            expect.any(Object)
        );
    });

    it('selectSlot makes a POST request', async () => {
        const data = { slot_id: '123' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });
        await selectSlot(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/select-slot'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(data)
            })
        );
    });

    it('getMyInterview calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getMyInterview();
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/my-interview'),
            expect.any(Object)
        );
    });

    describe('getApplicationForm', () => {
        it('returns form on success', async () => {
            const mockForm = { id: 1 };
            vi.mocked(client.apiRequest).mockResolvedValueOnce(mockForm);
            const result = await getApplicationForm();
            expect(result).toEqual(mockForm);
        });

        it('returns null on 404 error', async () => {
            vi.mocked(client.apiRequest).mockRejectedValueOnce(new Error('404 Not Found'));
            const result = await getApplicationForm();
            expect(result).toBeNull();
        });

        it('throws other errors', async () => {
            vi.mocked(client.apiRequest).mockRejectedValueOnce(new Error('500 Server Error'));
            await expect(getApplicationForm()).rejects.toThrow('500 Server Error');
        });
    });

    it('submitApplicationForm makes a POST request', async () => {
        const data = { name: 'Test' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ id: 1 });
        await submitApplicationForm(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/application-form/submit'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('uploadApplicationForm uses FormData and custom headers', async () => {
        const file = new File([''], 'test.pdf', { type: 'application/pdf' });
        vi.mocked(client.apiRequest).mockResolvedValueOnce({ success: true });

        await uploadApplicationForm(file);

        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/application-form/upload'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Authorization': 'Bearer test-token' },
                body: expect.any(FormData)
            })
        );
    });

    it('getStudentAnalytics calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getStudentAnalytics();
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/student/analytics'),
            expect.any(Object)
        );
    });
});
