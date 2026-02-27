/**
 * Auth API - login, register, password management.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders, saveAuthToken, saveUserData } from './client';
import type {
  LoginRequest, LoginResponse,
  ChangePasswordRequest, ResetPasswordRequest,
  AdminLoginRequest, AdminLoginResponse,
  StudentRegisterRequest, StudentLoginRequest, StudentLoginResponse,
} from './types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (result.success && result.token && result.user) {
    saveAuthToken(result.token);
    saveUserData(result.user);
  }
  return result;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
  return await apiRequest(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  return await apiRequest(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const result = await apiRequest<AdminLoginResponse>(`${API_BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (result.success && result.token) {
    saveAuthToken(result.token);
    saveUserData({ role: 'admin', username: data.username });
  }
  return result;
}

export async function studentRegister(data: StudentRegisterRequest): Promise<StudentLoginResponse> {
  const result = await apiRequest<StudentLoginResponse>(`${API_BASE_URL}/api/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (result.success && result.token && result.user) {
    saveAuthToken(result.token);
    saveUserData(result.user);
  }
  return result;
}

export async function studentLogin(data: StudentLoginRequest): Promise<StudentLoginResponse> {
  const result = await apiRequest<StudentLoginResponse>(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: data.email,
      password: data.password,
    }),
  });

  if (result.success && result.token && result.user) {
    saveAuthToken(result.token);
    saveUserData(result.user);
  }
  return result;
}
