/**
 * Slots API - interview slot CRUD.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders } from './client';
import type {
  SlotResponse, CreateSlotRequest, UpdateSlotRequest,
  CreateDaySlotsRequest, CreateDaySlotsResponse,
} from './types';

export async function getSlots(status?: string, includePast: boolean = false): Promise<SlotResponse[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (includePast) params.append('include_past', 'true');

  const url = `${API_BASE_URL}/api/slots/admin/slots${params.toString() ? '?' + params.toString() : ''}`;
  return apiRequest<SlotResponse[]>(url, {
    headers: getAuthHeaders(),
  });
}

export async function getAvailableSlots(): Promise<SlotResponse[]> {
  return apiRequest<SlotResponse[]>(`${API_BASE_URL}/api/slots/available`);
}

export async function createSlot(data: CreateSlotRequest): Promise<SlotResponse> {
  return apiRequest<SlotResponse>(`${API_BASE_URL}/api/slots/admin/slots`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      slot_datetime: new Date(data.slot_datetime).toISOString(),
    }),
  });
}

export async function updateSlot(slotId: string, data: UpdateSlotRequest): Promise<SlotResponse> {
  const updateData: any = { ...data };
  if (data.slot_datetime) {
    updateData.slot_datetime = new Date(data.slot_datetime).toISOString();
  }

  return apiRequest<SlotResponse>(`${API_BASE_URL}/api/slots/admin/slots/${slotId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
}

export async function deleteSlot(slotId: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/slots/admin/slots/${slotId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function createDaySlots(data: CreateDaySlotsRequest): Promise<CreateDaySlotsResponse> {
  return apiRequest<CreateDaySlotsResponse>(`${API_BASE_URL}/api/slots/admin/slots/create-day`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}
