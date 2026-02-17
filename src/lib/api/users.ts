/**
 * Users API - enrolled user CRUD, bulk enrollment.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders, getAuthToken } from './client';
import type {
  EnrollUserRequest, UserResponse, UserDetailResponse,
  UpdateUserRequest, BulkEnrollResponse,
} from './types';

export async function enrollUser(data: EnrollUserRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/users/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function getAllUsers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>(`${API_BASE_URL}/api/users/`, {
    headers: getAuthHeaders(),
  });
}

export async function getUser(userId: string): Promise<UserDetailResponse> {
  return apiRequest<UserDetailResponse>(`${API_BASE_URL}/api/users/${userId}`, {
    headers: getAuthHeaders(),
  });
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function bulkEnrollUsers(file: File): Promise<BulkEnrollResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<BulkEnrollResponse>(`${API_BASE_URL}/api/users/bulk-enroll`, {
    method: 'POST',
    headers,
    body: formData,
  });
}
