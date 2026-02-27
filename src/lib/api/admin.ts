/**
 * Admin API - job descriptions, candidates, managers, system instructions, Gemini usage.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders, getAuthToken } from './client';
import type {
  JobDescription, CandidateRegistrationRequest,
  ScheduleInterviewResponse, BulkRegistrationResponse,
  PaginatedCandidatesResponse, BookingResponse,
  UserResponse, ScheduleInterviewForUserRequest,
  BulkScheduleInterviewResponse,
} from './types';

export async function getJobDescription(): Promise<JobDescription> {
  return apiRequest<JobDescription>(`${API_BASE_URL}/api/admin/job-description`, {
    headers: getAuthHeaders(),
  });
}

export async function updateJobDescription(jd: JobDescription): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/job-description`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(jd),
  });
}

export async function registerCandidate(data: CandidateRegistrationRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/admin/register-candidate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function bulkRegisterCandidates(file: File): Promise<BulkRegistrationResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<BulkRegistrationResponse>(`${API_BASE_URL}/api/admin/candidates/bulk-register`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

export async function getAllCandidates(): Promise<PaginatedCandidatesResponse> {
  return apiRequest<PaginatedCandidatesResponse>(`${API_BASE_URL}/api/admin/candidates`, {
    headers: getAuthHeaders(),
  });
}

export async function getGeminiUsageReport(): Promise<BookingResponse[]> {
  return apiRequest<BookingResponse[]>(`${API_BASE_URL}/api/admin/gemini-usage`, {
    headers: getAuthHeaders(),
  });
}

export async function getManagers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>(`${API_BASE_URL}/api/admin/managers`, {
    headers: getAuthHeaders(),
  });
}

export async function enrollManager(name: string, email: string): Promise<{ id: string; temp_password: string }> {
  return apiRequest<{ id: string; temp_password: string }>(`${API_BASE_URL}/api/admin/managers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email }),
  });
}

export async function deleteManager(managerId: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/managers/${managerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function getSystemInstructions(): Promise<{ instructions: string }> {
  return apiRequest<{ instructions: string }>(`${API_BASE_URL}/api/admin/system-instructions`, {
    headers: getAuthHeaders(),
  });
}

export async function updateSystemInstructions(instructions: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/system-instructions`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ instructions }),
  });
}

export async function scheduleInterviewForUser(data: ScheduleInterviewForUserRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/admin/schedule-interview`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function bulkScheduleInterviews(file: File): Promise<BulkScheduleInterviewResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<BulkScheduleInterviewResponse>(`${API_BASE_URL}/api/admin/schedule-interview/bulk`, {
    method: 'POST',
    headers,
    body: formData,
  });
}
