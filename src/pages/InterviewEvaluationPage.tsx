import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getEvaluation, type EvaluationResponse, type RoundEvaluationResponse } from '@/lib/api';

// Using the API response types directly
type EvaluationData = EvaluationResponse;

const ROUND_INFO = [
  {
    number: 1,
    name: 'Self Introduction',
    description: 'Personal background, education, and career journey',
    time_target: 7,
    icon: '👋',
  },
  {
    number: 2,
    name: 'GK & Current Affairs',
    description: 'General knowledge and awareness of current events',
    time_target: 17,
    icon: '📰',
  },
  {
    number: 3,
    name: 'Domain Knowledge',
    description: 'Technical knowledge related to candidate\'s field',
    time_target: 29,
    icon: '🎓',
  },
  {
    number: 4,
    name: 'Banking & RRB',
    description: 'Banking fundamentals and RRB-specific knowledge',
    time_target: 44,
    icon: '🏦',
  },
  {
    number: 5,
    name: 'Situational & Closing',
    description: 'Practical scenarios and interview conclusion',
    time_target: 50,
    icon: '💼',
  },
];

export default function InterviewEvaluationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'transcript' | 'application'>('overview');

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

  const Layout = isAdmin ? AdminLayout : StudentLayout;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading evaluation data...</div>
        </div>
      </Layout>
    );
  }

  if (error || !evaluationData) {
    return (
      <Layout>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error || 'Evaluation data not available'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/student/my-interviews')}
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

        {/* Overall Score Card */}
        {evaluationData.overall_score && (
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
                  {evaluationData.interview_metrics?.rounds_completed || 0} / 5
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'rounds', label: 'Round Performance', icon: '🎯' },
              { id: 'transcript', label: 'Full Transcript', icon: '💬' },
              { id: 'application', label: 'Application Context', icon: '📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
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

        {activeTab === 'rounds' && (
          <div className="space-y-4">
            {evaluationData.rounds && evaluationData.rounds.length > 0 ? (
              evaluationData.rounds.map((round, index) => {
                const roundInfo = ROUND_INFO.find(r => r.number === round.round_number) || ROUND_INFO[index] || ROUND_INFO[0];
                return (
                  <div
                    key={round.round_number}
                    className="rounded-lg border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{roundInfo.icon}</span>
                          <div>
                            <h3 className="text-lg font-semibold">
                              Round {round.round_number}: {round.round_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{roundInfo.description}</p>
                          </div>
                        </div>
                      </div>
                      {round.average_rating && (
                        <div className={`rounded-lg px-4 py-2 ${getScoreBgColor(round.average_rating)}`}>
                          <div className="text-xs text-muted-foreground">Average Rating</div>
                          <div className={`text-2xl font-bold ${getScoreColor(round.average_rating)}`}>
                            {round.average_rating.toFixed(1)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Questions Asked</div>
                        <div className="mt-1 text-lg font-semibold">{round.questions_asked}</div>
                      </div>
                      {round.time_spent_minutes && (
                        <div>
                          <div className="text-sm text-muted-foreground">Time Spent</div>
                          <div className="mt-1 text-lg font-semibold">{round.time_spent_minutes.toFixed(1)} min</div>
                        </div>
                      )}
                      {round.time_target_minutes && (
                        <div>
                          <div className="text-sm text-muted-foreground">Target Time</div>
                          <div className="mt-1 text-lg font-semibold">{round.time_target_minutes} min</div>
                        </div>
                      )}
                    </div>

                    {round.topics_covered && round.topics_covered.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Topics Covered</div>
                        <div className="flex flex-wrap gap-2">
                          {round.topics_covered.map((topic, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {round.performance_summary && (
                      <div className="mt-4 rounded-md bg-muted p-3">
                        <div className="text-sm font-medium mb-1">Performance Summary</div>
                        <div className="text-sm text-muted-foreground">{round.performance_summary}</div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                Round evaluation data not available yet.
              </div>
            )}
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
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
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

        {activeTab === 'application' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Application Form Context</h2>
            {evaluationData.candidate.application_form?.text ? (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <div className="text-sm font-medium mb-2">Application Details</div>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {evaluationData.candidate.application_form.text}
                  </pre>
                </div>
                {evaluationData.candidate.application_form.url && (
                  <div>
                    <a
                      href={evaluationData.candidate.application_form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Application Document →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Application form data not available
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
