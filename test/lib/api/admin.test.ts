import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/api/client';
import {
    getJobDescription,
    updateJobDescription,
    registerCandidate,
    bulkRegisterCandidates,
    getAllCandidates,
    getGeminiUsageReport,
    getManagers,
    enrollManager,
    deleteManager,
    getSystemInstructions,
    updateSystemInstructions,
    scheduleInterviewForUser,
    bulkScheduleInterviews
} from '@/lib/api/admin';

vi.mock('@/lib/api/client', async () => {
    const actual = await vi.importActual('@/lib/api/client');
    return {
        ...actual,
        apiRequest: vi.fn(),
        getAuthHeaders: vi.fn(() => ({})),
        getAuthToken: vi.fn(() => 'test-token'),
    };
});

describe('Admin API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getJobDescription calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getJobDescription();
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/job-description'), expect.any(Object));
    });

    it('updateJobDescription makes a PUT request', async () => {
        const jd = { title: 'T' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await updateJobDescription(jd);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/job-description'),
            expect.objectContaining({ method: 'PUT', body: JSON.stringify(jd) })
        );
    });

    it('registerCandidate makes a POST request', async () => {
        const data = { name: 'C' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await registerCandidate(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/register-candidate'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('bulkRegisterCandidates uses FormData', async () => {
        const file = new File([''], 'c.csv');
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await bulkRegisterCandidates(file);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/candidates/bulk-register'),
            expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
        );
    });

    it('getAllCandidates calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getAllCandidates();
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/candidates'), expect.any(Object));
    });

    it('getGeminiUsageReport calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getGeminiUsageReport();
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/gemini-usage'), expect.any(Object));
    });

    it('getManagers calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce([]);
        await getManagers();
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/managers'), expect.any(Object));
    });

    it('enrollManager makes a POST request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await enrollManager('N', 'E');
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/managers'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'N', email: 'E' }) })
        );
    });

    it('deleteManager makes a DELETE request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await deleteManager('m1');
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/managers/m1'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('getSystemInstructions calls correct endpoint', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await getSystemInstructions();
        expect(client.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/admin/system-instructions'), expect.any(Object));
    });

    it('updateSystemInstructions makes a PUT request', async () => {
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await updateSystemInstructions('ins');
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/system-instructions'),
            expect.objectContaining({ method: 'PUT', body: JSON.stringify({ instructions: 'ins' }) })
        );
    });

    it('scheduleInterviewForUser makes a POST request', async () => {
        const data = { user_id: 'u1' } as any;
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await scheduleInterviewForUser(data);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/schedule-interview'),
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('bulkScheduleInterviews uses FormData', async () => {
        const file = new File([''], 's.csv');
        vi.mocked(client.apiRequest).mockResolvedValueOnce({});
        await bulkScheduleInterviews(file);
        expect(client.apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/schedule-interview/bulk'),
            expect.objectContaining({ method: 'POST' })
        );
    });
});
