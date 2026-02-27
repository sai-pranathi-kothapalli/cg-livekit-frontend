/**
 * Student API - assignments, interviews, application forms, analytics.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders, getAuthToken } from './client';
import type {
  AssignmentResponse, SelectSlotRequest, ScheduleInterviewResponse,
  MyInterviewResponse, ApplicationFormResponse, ApplicationFormSubmitRequest,
  StudentAnalyticsResponse,
} from './types';

export async function getMyAssignments(): Promise<AssignmentResponse[]> {
  return apiRequest<AssignmentResponse[]>(`${API_BASE_URL}/api/student/my-assignments`, {
    headers: getAuthHeaders(),
  });
}

export async function selectSlot(data: SelectSlotRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/student/select-slot`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function getMyInterview(): Promise<MyInterviewResponse> {
  return apiRequest<MyInterviewResponse>(`${API_BASE_URL}/api/student/my-interview`, {
    headers: getAuthHeaders(),
  });
}

export async function getApplicationForm(): Promise<ApplicationFormResponse | null> {
  try {
    return await apiRequest<ApplicationFormResponse>(`${API_BASE_URL}/api/student/application-form`, {
      headers: getAuthHeaders(),
    });
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}

export async function submitApplicationForm(data: ApplicationFormSubmitRequest): Promise<ApplicationFormResponse> {
  return apiRequest<ApplicationFormResponse>(`${API_BASE_URL}/api/student/application-form/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function uploadApplicationForm(file: File): Promise<{ success: boolean; form: ApplicationFormResponse; extraction_error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<{ success: boolean; form: ApplicationFormResponse; extraction_error?: string }>(`${API_BASE_URL}/api/student/application-form/upload`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });
}

export async function getStudentAnalytics(): Promise<StudentAnalyticsResponse> {
  return apiRequest<StudentAnalyticsResponse>(`${API_BASE_URL}/api/student/analytics`, {
    headers: getAuthHeaders(),
  });
}
