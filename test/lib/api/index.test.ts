import { describe, it, expect } from 'vitest';
import * as api from '@/lib/api/index';

describe('API Barrel File (index.ts)', () => {
    it('exports client utilities', () => {
        expect(api.saveAuthToken).toBeDefined();
        expect(api.removeAuthToken).toBeDefined();
        expect(api.getUserRole).toBeDefined();
        expect(api.saveUserData).toBeDefined();
        expect(api.getUserData).toBeDefined();
    });

    it('exports auth functions', () => {
        expect(api.login).toBeDefined();
        expect(api.changePassword).toBeDefined();
        expect(api.resetPassword).toBeDefined();
        expect(api.adminLogin).toBeDefined();
        expect(api.studentRegister).toBeDefined();
        expect(api.studentLogin).toBeDefined();
    });

    it('exports admin functions', () => {
        expect(api.getJobDescription).toBeDefined();
        expect(api.updateJobDescription).toBeDefined();
        expect(api.registerCandidate).toBeDefined();
        expect(api.bulkRegisterCandidates).toBeDefined();
        expect(api.getAllCandidates).toBeDefined();
        expect(api.getGeminiUsageReport).toBeDefined();
        expect(api.getManagers).toBeDefined();
        expect(api.enrollManager).toBeDefined();
        expect(api.deleteManager).toBeDefined();
        expect(api.getSystemInstructions).toBeDefined();
        expect(api.updateSystemInstructions).toBeDefined();
        expect(api.scheduleInterviewForUser).toBeDefined();
        expect(api.bulkScheduleInterviews).toBeDefined();
    });

    it('exports booking functions', () => {
        expect(api.scheduleInterview).toBeDefined();
        expect(api.getInterviewAccessConfig).toBeDefined();
        expect(api.getBooking).toBeDefined();
        expect(api.uploadApplication).toBeDefined();
    });

    it('exports interview functions', () => {
        expect(api.getEvaluation).toBeDefined();
    });

    it('exports slot functions', () => {
        expect(api.getSlots).toBeDefined();
        expect(api.getAvailableSlots).toBeDefined();
        expect(api.createSlot).toBeDefined();
        expect(api.updateSlot).toBeDefined();
        expect(api.deleteSlot).toBeDefined();
        expect(api.createDaySlots).toBeDefined();
    });

    it('exports user functions', () => {
        expect(api.enrollUser).toBeDefined();
        expect(api.getAllUsers).toBeDefined();
        expect(api.getUser).toBeDefined();
        expect(api.updateUser).toBeDefined();
        expect(api.deleteUser).toBeDefined();
        expect(api.bulkEnrollUsers).toBeDefined();
    });

    it('exports student functions', () => {
        expect(api.getMyAssignments).toBeDefined();
        expect(api.selectSlot).toBeDefined();
        expect(api.getMyInterview).toBeDefined();
        expect(api.getApplicationForm).toBeDefined();
        expect(api.submitApplicationForm).toBeDefined();
        expect(api.uploadApplicationForm).toBeDefined();
        expect(api.getStudentAnalytics).toBeDefined();
    });
});
