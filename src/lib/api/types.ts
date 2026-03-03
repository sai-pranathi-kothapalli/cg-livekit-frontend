/**
 * Shared TypeScript interfaces for API requests and responses.
 */

// ==================== Booking / Interview Types ====================

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

// ==================== Auth Types ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  role?: 'admin' | 'manager' | 'student';
  user?: {
    id: string;
    email?: string;
    name?: string;
    username?: string;
    phone?: string;
    role: 'admin' | 'manager' | 'student';
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

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

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

// ==================== Admin Types ====================

export interface JobDescription {
  context: string;
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

// ==================== User Types ====================

export interface EnrollUserRequest {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  slot_ids?: string[];
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

export interface InterviewSummary {
  token: string;
  scheduled_at: string;
  status: string;
  overall_score?: number;
  overall_feedback?: string;
  evaluation_url?: string;
  interview_url?: string;
}

export interface UserDetailResponse extends UserResponse {
  interviews: InterviewSummary[];
  overall_analysis?: string | null;
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

// ==================== Slot Types ====================

export interface SlotResponse {
  id: string;
  slot_datetime: string;
  start_time?: string;
  end_time?: string;
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
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateSlotRequest {
  slot_datetime?: string;
  max_capacity?: number;
  status?: string;
  notes?: string;
}

export interface CreateDaySlotsRequest {
  date: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  max_capacity: number;
  notes?: string;
}

export interface CreateDaySlotsResponse {
  success: boolean;
  created_count: number;
  slots: SlotResponse[];
  errors?: string[];
}

// ==================== Student Types ====================

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
  slot_id: string;
  prompt?: string;
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

export interface ApplicationFormResponse {
  id: string;
  user_id: string;
  status: string;
  full_name: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  application_file_url?: string;
  extracted_json_url?: string;
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

export interface StudentAnalyticsResponse {
  total_interviews: number;
  average_scores: {
    overall: number;
    communication: number;
    technical: number;
    problem_solving: number;
  };
  history: Array<{
    date: string;
    score: number;
    communication: number;
    technical: number;
    problem_solving: number;
  }>;
  recent_strengths: string[];
  recent_improvements: string[];
  overall_analysis?: string | null;
}

// ==================== Evaluation Types ====================

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
  communication_quality?: number;
  technical_knowledge?: number;
  problem_solving?: number;
  overall_feedback?: string;
  token_usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

// ==================== Interview Config Types ====================

export interface InterviewAccessConfig {
  require_login_for_interview: boolean;
}

// ==================== Schedule Types ====================

export interface ScheduleInterviewForUserRequest {
  user_id: string;
  slot_id: string;
  prompt?: string;
}

export interface BulkScheduleInterviewResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors?: string[];
}
