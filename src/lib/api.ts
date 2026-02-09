/**
 * API Client
 * 
 * Centralized API client for calling the Python backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';

// Note: Empty string means relative paths, which works fine for same-origin requests

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Get authorization headers with token if available
 */
function getAuthHeaders(skipContentType: boolean = false): HeadersInit {
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

/**
 * Save auth token to localStorage
 */
export function saveAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove auth token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
}

/**
 * Get user role from localStorage
 */
export function getUserRole(): string | null {
  return localStorage.getItem('userRole');
}

/**
 * Save user data to localStorage
 */
export function saveUserData(userData: any): void {
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('userRole', userData.role || '');
}

/**
 * Get user data from localStorage
 */
export function getUserData(): any | null {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

export interface UploadApplicationResponse {
  applicationUrl: string;
  applicationText?: string | null;
  extractionError?: string | null;
}

export interface ScheduleInterviewRequest {
  name: string;
  email: string;
  phone: string;
  datetime: string;
  applicationUrl?: string;
  applicationText?: string;
}

export interface ScheduleInterviewResponse {
  ok: boolean;
  interviewUrl: string;
  emailSent: boolean;
  emailError?: string | null;
}

export interface BookingResponse {
  token: string;
  name: string;
  email: string;
  phone: string;
  scheduled_at: string;
  created_at: string;
  application_text?: string | null;
  application_url?: string | null;
  slot_id?: string | null;
  slot?: {
    id: string;
    slot_datetime: string;
    end_time?: string;
    duration_minutes?: number;
    max_capacity?: number;
    current_bookings?: number;
    status?: string;
  } | null;
  /** Must be true to attend interview; false means user must complete application form first */
  application_form_submitted?: boolean | null;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export interface PaginatedCandidatesResponse {
  items: BookingResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Centralized API request handler with auto-logout on 401
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // Token expired or invalid
    removeAuthToken();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    const error = await response.json().catch(() => ({ detail: 'Session expired' }));
    throw new Error(error.detail || error.error || 'Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API request failed' }));
    throw new Error(error.detail || error.error || 'API request failed');
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return {} as T;
}

/**
 * Upload application file and extract text
 */
export async function uploadApplication(file: File): Promise<UploadApplicationResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<UploadApplicationResponse>(`${API_BASE_URL}/api/upload-application`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Schedule an interview
 */
export async function scheduleInterview(data: ScheduleInterviewRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/schedule-interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Public config: whether interview link requires login (no auth required).
 * Used by InterviewPage to decide whether to show login gate or allow direct access.
 */
export interface InterviewAccessConfig {
  require_login_for_interview: boolean;
}

export async function getInterviewAccessConfig(): Promise<InterviewAccessConfig> {
  const url = `${API_BASE_URL}/api/public/interview-config`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load interview config: ${res.statusText}`);
  return res.json();
}

/**
 * Get booking by token
 * Requires authentication when backend REQUIRE_LOGIN_FOR_INTERVIEW=true; optional when false.
 */
export async function getBooking(token: string): Promise<BookingResponse | null> {
  try {
    return await apiRequest<BookingResponse>(`${API_BASE_URL}/api/booking/${token}`, {
      headers: getAuthHeaders(),
    });
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}

// ==================== Evaluation API Functions ====================

export interface RoundEvaluationResponse {
  round_number: number;
  round_name: string;
  questions_asked: number;
  average_rating?: number;
  time_spent_minutes?: number;
  time_target_minutes?: number;
  topics_covered: string[];
  performance_summary?: string;
  response_ratings: number[];
}

export interface EvaluationResponse {
  booking: BookingResponse;
  candidate: {
    name: string;
    email: string;
    application_form?: {
      text?: string;
      url?: string;
    };
  };
  interview_metrics?: {
    duration_minutes?: number;
    rounds_completed?: number;
    total_questions?: number;
    average_response_time?: number;
  };
  rounds: RoundEvaluationResponse[];
  overall_score?: number;
  strengths: string[];
  areas_for_improvement: string[];
  transcript: Array<{
    role: string;
    content: string;
    timestamp?: string;
    index?: number;
  }>;
  /** Criteria scores from Gemini analysis (0–10) */
  communication_quality?: number;
  technical_knowledge?: number;
  problem_solving?: number;
  /** Overall feedback paragraph from AI */
  overall_feedback?: string;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get evaluation data for an interview from the backend API.
 */
export async function getEvaluation(token: string): Promise<EvaluationResponse> {
  return apiRequest<EvaluationResponse>(`${API_BASE_URL}/api/evaluation/${token}`, {
    headers: getAuthHeaders(),
  });
}

// ==================== Unified Login API Functions ====================

export interface LoginRequest {
  username: string; // Can be username (admin) or email (student)
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  role?: 'admin' | 'student';
  user?: {
    id: string;
    email?: string;
    name?: string;
    username?: string;
    phone?: string;
    role: 'admin' | 'student';
  };
  must_change_password?: boolean;
}

export interface ChangePasswordRequest {
  email: string;
  old_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
  new_password: string;
}

/**
 * Unified login - automatically detects admin or student
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>(`${API_BASE_URL}/api/login`, {
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

/**
 * Change password for a student (requires old password)
 */
export async function changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
  return await apiRequest(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Reset password for a student (forgot password flow)
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  return await apiRequest(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ==================== Admin API Functions ====================

export interface JobDescription {
  context: string;  // Full interview/agent context (admin-editable)
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface CandidateRegistrationRequest {
  name: string;
  email: string;
  phone: string;
  datetime: string;
}

export interface BulkRegistrationResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: string[];
}

/**
 * Admin login
 */
export async function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const result = await apiRequest<AdminLoginResponse>(`${API_BASE_URL}/api/admin/login`, {
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

/**
 * Get job description
 */
export async function getJobDescription(): Promise<JobDescription> {
  return apiRequest<JobDescription>(`${API_BASE_URL}/api/admin/job-description`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Update job description
 */
export async function updateJobDescription(jd: JobDescription): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/job-description`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(jd),
  });
}

/**
 * Register a single candidate
 */
export async function registerCandidate(data: CandidateRegistrationRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/admin/register-candidate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Bulk register candidates from Excel file
 */
export async function bulkRegisterCandidates(file: File): Promise<BulkRegistrationResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<BulkRegistrationResponse>(`${API_BASE_URL}/api/admin/bulk-register`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

/**
 * Get all candidates
 */
export async function getAllCandidates(): Promise<PaginatedCandidatesResponse> {
  return apiRequest<PaginatedCandidatesResponse>(`${API_BASE_URL}/api/admin/candidates`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Get Gemini usage report (non-paginated)
 */
export async function getGeminiUsageReport(): Promise<BookingResponse[]> {
  return apiRequest<BookingResponse[]>(`${API_BASE_URL}/api/admin/gemini-usage`, {
    headers: getAuthHeaders(),
  });
}

// ==================== Enrolled Users API Functions ====================

export interface EnrollUserRequest {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  slot_ids?: string[]; // List of slot IDs to assign (min 10 slots in next 2 days)
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  notes?: string;
}

export interface BulkEnrollResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: string[];
}

export interface AssignmentResponse {
  id: string;
  user_id: string;
  slot_id: string;
  status: string;
  assigned_at: string;
  selected_at?: string;
  slot: SlotResponse;
}

export interface SelectSlotRequest {
  assignment_id: string;
}

export interface MyInterviewResponse {
  upcoming: Array<{
    booking: {
      token: string;
      scheduled_at: string;
      interview_url?: string;
      name?: string;
      email?: string;
    };
    slot: SlotResponse | null;
  }>;
  missed: Array<{
    booking: {
      token: string;
      scheduled_at: string;
      interview_url?: string;
      name?: string;
      email?: string;
      status?: string;
    };
    slot: SlotResponse | null;
  }>;
  completed: Array<{
    booking: any;
    slot: SlotResponse | null;
  }>;
}

/**
 * Enroll a new user
 */
export async function enrollUser(data: EnrollUserRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Get all enrolled users
 */
export async function getAllUsers(): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>(`${API_BASE_URL}/api/admin/users`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Get a user by ID
 */
export async function getUser(userId: string): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/admin/users/${userId}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Update a user
 */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

// ==================== Interview Slots API Functions ====================

export interface SlotResponse {
  id: string;
  slot_datetime: string;
  start_time?: string; // Optional: start time of the slot
  end_time?: string; // Optional: end time of the slot
  max_capacity: number;
  current_bookings: number;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CreateSlotRequest {
  slot_datetime: string;
  max_capacity: number;
  duration_minutes?: number; // Interview duration in minutes (default 45)
  notes?: string;
}

export interface UpdateSlotRequest {
  slot_datetime?: string;
  max_capacity?: number;
  status?: string;
  notes?: string;
}

/**
 * Get all interview slots (admin only)
 */
export async function getSlots(status?: string, includePast: boolean = false): Promise<SlotResponse[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (includePast) params.append('include_past', 'true');

  const url = `${API_BASE_URL}/api/admin/slots${params.toString() ? '?' + params.toString() : ''}`;
  return apiRequest<SlotResponse[]>(url, {
    headers: getAuthHeaders(),
  });
}

/**
 * Get available slots (public, for students)
 */
export async function getAvailableSlots(): Promise<SlotResponse[]> {
  return apiRequest<SlotResponse[]>(`${API_BASE_URL}/api/slots/available`);
}

// ==================== Student Interview API Functions ====================

/**
 * Get my slot assignments (enrolled slots)
 */
export async function getMyAssignments(): Promise<AssignmentResponse[]> {
  return apiRequest<AssignmentResponse[]>(`${API_BASE_URL}/api/student/my-assignments`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Select a slot from assigned slots
 */
export async function selectSlot(data: SelectSlotRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/student/select-slot`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Get my interview status (enrolled/scheduled/completed)
 */
export async function getMyInterview(): Promise<MyInterviewResponse> {
  return apiRequest<MyInterviewResponse>(`${API_BASE_URL}/api/student/my-interview`, {
    headers: getAuthHeaders(),
  });
}

// ==================== Application Form API Functions ====================

export interface ApplicationFormResponse {
  id: string;
  user_id: string;
  status: string;
  full_name: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationFormSubmitRequest {
  full_name: string;
  post?: string;
  category?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  aadhaar_number?: string;
  pan_number?: string;
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  correspondence_address1?: string;
  correspondence_address2?: string;
  correspondence_address3?: string;
  correspondence_state?: string;
  correspondence_district?: string;
  correspondence_pincode?: string;
  permanent_address1?: string;
  permanent_address2?: string;
  permanent_address3?: string;
  permanent_state?: string;
  permanent_district?: string;
  permanent_pincode?: string;
  ssc_board?: string;
  ssc_passing_date?: string;
  ssc_percentage?: string;
  ssc_class?: string;
  graduation_degree?: string;
  graduation_college?: string;
  graduation_specialization?: string;
  graduation_passing_date?: string;
  graduation_percentage?: string;
  graduation_class?: string;
  religion?: string;
  religious_minority?: boolean;
  local_language_studied?: boolean;
  local_language_name?: string;
  computer_knowledge?: boolean;
  computer_knowledge_details?: string;
  languages_known?: Record<string, { read: boolean; write: boolean; speak: boolean }>;
  state_applying_for?: string;
  regional_rural_bank?: string;
  exam_center_preference1?: string;
  exam_center_preference2?: string;
  medium_of_paper?: string;
  application_file_url?: string;
  application_text?: string;
}

/**
 * Get application form status
 */
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

/**
 * Submit application form
 */
export async function submitApplicationForm(data: ApplicationFormSubmitRequest): Promise<ApplicationFormResponse> {
  return apiRequest<ApplicationFormResponse>(`${API_BASE_URL}/api/student/application-form/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Upload application form PDF
 */
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

/**
 * Create a new interview slot
 */
export async function createSlot(data: CreateSlotRequest): Promise<SlotResponse> {
  return apiRequest<SlotResponse>(`${API_BASE_URL}/api/admin/slots`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      slot_datetime: new Date(data.slot_datetime).toISOString(),
    }),
  });
}

/**
 * Update an interview slot
 */
export async function updateSlot(slotId: string, data: UpdateSlotRequest): Promise<SlotResponse> {
  const updateData: any = { ...data };
  if (data.slot_datetime) {
    updateData.slot_datetime = new Date(data.slot_datetime).toISOString();
  }

  return apiRequest<SlotResponse>(`${API_BASE_URL}/api/admin/slots/${slotId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
}

/**
 * Delete an interview slot
 */
export async function deleteSlot(slotId: string): Promise<void> {
  return apiRequest<void>(`${API_BASE_URL}/api/admin/slots/${slotId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

/**
 * Create multiple slots for a day
 */
export interface CreateDaySlotsRequest {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24-hour format)
  end_time: string; // HH:MM (24-hour format)
  interval_minutes: number; // Minutes between slots
  max_capacity: number; // Capacity for each slot
  notes?: string;
}

export interface CreateDaySlotsResponse {
  success: boolean;
  created_count: number;
  slots: SlotResponse[];
  errors?: string[];
}

export async function createDaySlots(data: CreateDaySlotsRequest): Promise<CreateDaySlotsResponse> {
  return apiRequest<CreateDaySlotsResponse>(`${API_BASE_URL}/api/admin/slots/create-day`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Bulk enroll users from Excel file
 */
export async function bulkEnrollUsers(file: File): Promise<BulkEnrollResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<BulkEnrollResponse>(`${API_BASE_URL}/api/admin/users/bulk-enroll`, {
    method: 'POST',
    headers,
    body: formData,
  });
}

// ==================== Schedule Interview API Functions ====================

export interface ScheduleInterviewForUserRequest {
  user_id: string;
  slot_id: string;  // ID of the interview slot to book
}

export interface BulkScheduleInterviewResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: string[];
}

/**
 * Schedule interview for an enrolled user
 */
export async function scheduleInterviewForUser(data: ScheduleInterviewForUserRequest): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/admin/schedule-interview`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Bulk schedule interviews from Excel file
 */
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

// ==================== Student Authentication API Functions ====================

export interface StudentRegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface StudentLoginRequest {
  email: string;
  password: string;
}

export interface StudentLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
  };
}

/**
 * Student registration
 */
export async function studentRegister(data: StudentRegisterRequest): Promise<StudentLoginResponse> {
  const result = await apiRequest<StudentLoginResponse>(`${API_BASE_URL}/api/student/register`, {
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

/**
 * Student login
 */
export async function studentLogin(data: StudentLoginRequest): Promise<StudentLoginResponse> {
  const result = await apiRequest<StudentLoginResponse>(`${API_BASE_URL}/api/student/login`, {
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

// ==================== User API Functions ====================

export interface RRBApplicationFormData {
  // This will match the RRBFormData interface from UserApplicationForm
  [key: string]: any;
}

/**
 * Submit RRB application form
 */
export async function submitRRBApplication(formData: RRBApplicationFormData): Promise<ScheduleInterviewResponse> {
  return apiRequest<ScheduleInterviewResponse>(`${API_BASE_URL}/api/user/application`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
}

/**
 * Get application by token
 */
export async function getApplicationByToken(token: string): Promise<RRBApplicationFormData | null> {
  try {
    return await apiRequest<RRBApplicationFormData>(`${API_BASE_URL}/api/user/application/${token}`);
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}
