/**
 * Core API client - base URL, auth helpers, and centralized request handler.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';

// ==================== Auth Token Helpers ====================

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export function getAuthHeaders(skipContentType: boolean = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!skipContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function saveAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
}

export function getUserRole(): string | null {
  return localStorage.getItem('userRole');
}

export function saveUserData(userData: any): void {
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('userRole', userData.role || '');
}

export function getUserData(): any | null {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// ==================== Centralized Request Handler ====================

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (response.status === 401) {
    removeAuthToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    const error = await response.json().catch(() => ({ detail: 'Session expired' }));
    throw new Error(error.detail || error.error || 'Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API request failed' }));
    throw new Error(error.detail || error.error || 'API request failed');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return {} as T;
}
