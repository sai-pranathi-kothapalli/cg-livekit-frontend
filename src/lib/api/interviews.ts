/**
 * Interviews API - evaluations.
 */

import { apiRequest, API_BASE_URL, getAuthHeaders } from './client';
import type { EvaluationResponse } from './types';

export async function getEvaluation(token: string): Promise<EvaluationResponse> {
  return apiRequest<EvaluationResponse>(`${API_BASE_URL}/api/interviews/evaluation/${token}`, {
    headers: getAuthHeaders(),
  });
}
