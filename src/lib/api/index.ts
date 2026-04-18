/**
 * API Barrel Export
 *
 * Re-exports all modules so existing `import { ... } from '@/lib/api'` imports
 * continue to work without changes. New code should import from specific modules:
 *
 *   import { login } from '@/lib/api/auth';
 *   import { getSlots } from '@/lib/api/slots';
 *   import type { SlotResponse } from '@/lib/api/types';
 */

// Core client utilities
export {
  API_BASE_URL,
  saveAuthToken,
  removeAuthToken,
  getUserRole,
  saveUserData,
  getUserData,
} from './client';

// All types
export type {
  UploadApplicationResponse,
  ScheduleInterviewRequest,
  ScheduleInterviewResponse,
  BookingResponse,
  PaginatedCandidatesResponse,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  PasswordResetRequest,
  PasswordResetVerify,
  AdminLoginRequest,
  AdminLoginResponse,
  StudentRegisterRequest,
  StudentLoginRequest,
  StudentLoginResponse,
  JobDescription,
  CandidateRegistrationRequest,
  BulkRegistrationResponse,
  EnrollUserRequest,
  UserResponse,
  InterviewSummary,
  UserDetailResponse,
  UpdateUserRequest,
  BulkEnrollResponse,
  SlotResponse,
  CreateSlotRequest,
  UpdateSlotRequest,
  CreateDaySlotsRequest,
  CreateDaySlotsResponse,
  AssignmentResponse,
  SelectSlotRequest,
  MyInterviewResponse,
  ApplicationFormResponse,
  ApplicationFormSubmitRequest,
  StudentAnalyticsResponse,
  RoundEvaluationResponse,
  EvaluationResponse,
  InterviewAccessConfig,
  ScheduleInterviewForUserRequest,
  BulkScheduleInterviewResponse,
} from './types';

// Auth functions
export {
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
  adminLogin,
  studentRegister,
  studentLogin,
} from './auth';

// Admin functions
export {
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
  bulkScheduleInterviews,
} from './admin';

// Booking functions
export {
  scheduleInterview,
  getInterviewAccessConfig,
  getBooking,
  uploadApplication,
} from './bookings';

// Interview functions
export { getEvaluation } from './interviews';

// Slot functions
export {
  getSlots,
  getAvailableSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  createDaySlots,
} from './slots';

// User functions
export {
  enrollUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  bulkEnrollUsers,
} from './users';

// Student functions
export {
  getMyAssignments,
  selectSlot,
  getMyInterview,
  getApplicationForm,
  submitApplicationForm,
  uploadApplicationForm,
  getStudentAnalytics,
} from './student';
