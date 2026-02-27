/**
 * Bookings API - scheduling interviews, fetching bookings.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders } from './client';
import type {
  ScheduleInterviewRequest, ScheduleInterviewResponse,
  BookingResponse, InterviewAccessConfig, UploadApplicationResponse,
} from './types';

export async function scheduleInterview(data: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/bookings/schedule-interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getInterviewAccessConfig(): Promise<InterviewAccessConfig> {
  const url = `${API_BASE_URL}/api/public/interview-config`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load interview config: ${res.statusText}`);
  return res.json();
}

export async function getBooking(token: string): Promise<BookingResponse | null> {
  try {
    return await apiRequest<BookingResponse>(`${API_BASE_URL}/api/bookings/booking/${token}`, {
      headers: getAuthHeaders(),
    });
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}

export async function uploadApplication(file: File): Promise<UploadApplicationResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<UploadApplicationResponse>(`${API_BASE_URL}/api/resume/upload-application`, {
    method: 'POST',
    body: formData,
  });
}
