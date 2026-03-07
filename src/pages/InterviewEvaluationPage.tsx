import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getEvaluation, type EvaluationResponse } from '@/lib/api';

// Using the API response types directly
type EvaluationData = EvaluationResponse;

export default function InterviewEvaluationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const backTo = isAdmin ? '/admin/dashboard' : '/student/my-interviews';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('overview');

  useEffect(() => {
    if (token) {
      loadEvaluationData();
    }
  }, [token]);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch evaluation data from API
      const data = await getEvaluation(token!);
      setEvaluationData(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900';
    if (score >= 6) return 'bg-blue-100 dark:bg-blue-900';
    if (score >= 4) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const standaloneWrapper = (content: ReactNode) => (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{content}</div>
    </div>
  );

  if (loading) {
    return standaloneWrapper(
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading evaluation data...</div>
      </div>
    );
  }

  if (error || !evaluationData) {
    return standaloneWrapper(
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        {error || 'Evaluation data not available'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Interview Evaluation</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive assessment of interview performance
              </p>
            </div>
            <button
              onClick={() => navigate(backTo)}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              ← Back
            </button>
          </div>

          {/* Interview Overview Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Interview Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Interview Date & Time</div>
                <div className="mt-1 text-lg font-semibold">
                  {formatDate(evaluationData.booking.scheduled_at)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="mt-1 text-lg font-semibold">
                  {evaluationData.interview_metrics?.duration_minutes
                    ? `${evaluationData.interview_metrics.duration_minutes} minutes`
                    : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Processing State if feedback indicates progress */}
          {evaluationData.overall_feedback === "AI analysis in progress..." && (

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center gap-4">
                <div className="animate-spin text-2xl">⏳</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI Analysis in Progress</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    We're still calculating your detailed scores and feedback. This page will update automatically once the analysis is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Score Card */}
          {evaluationData.overall_score != null && (
            <div className={`rounded-lg border border-border p-6 shadow-sm ${getScoreBgColor(evaluationData.overall_score)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Overall Performance Score</div>
                  <div className={`mt-2 text-4xl font-bold ${getScoreColor(evaluationData.overall_score)}`}>
                    {evaluationData.overall_score.toFixed(1)} / 10
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Rounds Completed</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {evaluationData.interview_metrics?.rounds_completed ?? 0} / 5
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Criteria Scores (from Gemini analysis) */}
          {(evaluationData.communication_quality != null || evaluationData.technical_knowledge != null || evaluationData.problem_solving != null) && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Analysis Criteria</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Scores from AI analysis of your interview (0–10 per criterion).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evaluationData.communication_quality != null && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="text-sm font-medium text-muted-foreground">Communication Quality</div>
                    <div className={`mt-2 text-2xl font-bold ${getScoreColor(evaluationData.communication_quality)}`}>
                      {evaluationData.communication_quality.toFixed(1)} / 10
                    </div>
                  </div>
                )}
                {evaluationData.technical_knowledge != null && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="text-sm font-medium text-muted-foreground">Technical Knowledge</div>
                    <div className={`mt-2 text-2xl font-bold ${getScoreColor(evaluationData.technical_knowledge)}`}>
                      {evaluationData.technical_knowledge.toFixed(1)} / 10
                    </div>
                  </div>
                )}
                {evaluationData.problem_solving != null && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="text-sm font-medium text-muted-foreground">Problem Solving</div>
                    <div className={`mt-2 text-2xl font-bold ${getScoreColor(evaluationData.problem_solving)}`}>
                      {evaluationData.problem_solving.toFixed(1)} / 10
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overall Feedback (AI summary paragraph) */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Overall Feedback</h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap italic">
              {evaluationData.overall_feedback || "No feedback available yet."}
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'transcript', label: 'Full Transcript', icon: '💬' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                  <div className="mt-1 text-2xl font-bold">
                    {evaluationData.interview_metrics?.total_questions || 0}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  <div className="mt-1 text-2xl font-bold">
                    {evaluationData.interview_metrics?.average_response_time || 0}s
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Rounds Completed</div>
                  <div className="mt-1 text-2xl font-bold">
                    {evaluationData.interview_metrics?.rounds_completed || 0} / 5
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Interview Duration</div>
                  <div className="mt-1 text-2xl font-bold">
                    {evaluationData.interview_metrics?.duration_minutes || 0} min
                  </div>
                </div>
              </div>

              {/* Token Usage */}
              {evaluationData.token_usage && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
                  <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
                    📊 Gemini Token Usage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Input Tokens (Prompt)</div>
                      <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {evaluationData.token_usage.input_tokens?.toLocaleString() || 0}
                      </div>
                      <p className="mt-1 text-xs text-blue-700/70 dark:text-blue-400/70">Context + User Speech</p>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Output Tokens (Completion)</div>
                      <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {evaluationData.token_usage.output_tokens?.toLocaleString() || 0}
                      </div>
                      <p className="mt-1 text-xs text-blue-700/70 dark:text-blue-400/70">AI Responses</p>
                    </div>
                    <div className="rounded-lg bg-blue-100 p-4 dark:bg-blue-900">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Tokens</div>
                      <div className="mt-1 text-2xl font-bold text-blue-950 dark:text-white">
                        {evaluationData.token_usage.total_tokens?.toLocaleString() || 0}
                      </div>
                      <p className="mt-1 text-xs text-blue-800/70 dark:text-blue-300/70">Cumulative session usage</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
                  <h3 className="mb-4 text-lg font-semibold text-green-900 dark:text-green-100">
                    ✨ Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluationData.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                        <span className="mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950">
                  <h3 className="mb-4 text-lg font-semibold text-orange-900 dark:text-orange-100">
                    📈 Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {evaluationData.areas_for_improvement?.map((area, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200">
                        <span className="mt-1">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Full Interview Transcript</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {evaluationData.transcript && evaluationData.transcript.length > 0 ? (
                  evaluationData.transcript.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.role === 'assistant'
                            ? 'bg-muted text-foreground'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                      >
                        <div className="mb-1 text-xs font-medium opacity-70">
                          {message.role === 'user' ? 'Candidate' : message.role === 'assistant' ? 'Interviewer' : 'System'}
                          {message.timestamp && (
                            <span className="ml-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Transcript not available
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
