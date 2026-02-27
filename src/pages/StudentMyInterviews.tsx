import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { getMyInterview, getStudentAnalytics, type MyInterviewResponse, type StudentAnalyticsResponse } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function StudentMyInterviews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'missed' | 'completed'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<MyInterviewResponse | null>(null);
  const [_analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
  const [_loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    loadInterviewData();
    loadAnalytics();
  }, []);

  const loadInterviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyInterview();
      setInterviewData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getStudentAnalytics();
      setAnalytics(data);
    } catch (err) {
      debug.error('Failed to load analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };


  // Format date and time in IST
  const formatDateDisplay = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatSlotTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatDateTime = (isoString: string): string => {
    return `${formatDateDisplay(isoString)} at ${formatSlotTime(isoString)}`;
  };

  if (loading && !interviewData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading interview data...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Interviews</h1>
          <p className="text-muted-foreground mt-1">Manage your interview schedule</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Upcoming Interviews {interviewData?.upcoming?.length ? `(${interviewData.upcoming.length})` : '(0)'}
            </button>
            <button
              onClick={() => setActiveTab('missed')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'missed'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Missed Interviews {interviewData?.missed?.length ? `(${interviewData.missed.length})` : '(0)'}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Completed Interviews {interviewData?.completed?.length ? `(${interviewData.completed.length})` : '(0)'}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'upcoming' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Upcoming Interviews</h2>

            {!interviewData || !interviewData.upcoming || interviewData.upcoming.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No upcoming interviews scheduled. An administrator will schedule your interview and it will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {interviewData.upcoming.map((item, index) => {
                  const booking = item.booking;
                  const slot = item.slot;
                  const scheduledAt = slot?.slot_datetime || slot?.start_time || booking?.scheduled_at;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Interview Date & Time</div>
                          <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {scheduledAt ? formatDateTime(scheduledAt) : 'Interview Scheduled'}
                          </div>
                        </div>

                        {booking?.interview_url && (
                          <div>
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Interview Link</div>
                            <div className="mt-2">
                              <a
                                href={booking.interview_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block break-all rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                              >
                                Join Interview
                              </a>
                            </div>
                            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                              {booking.interview_url}
                            </div>
                          </div>
                        )}

                        <div className="rounded-md border border-blue-300 bg-blue-100 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100">
                          <strong>⚠️ Important:</strong> Please join the interview at the scheduled time. The link is only accessible during the scheduled interview time window.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'missed' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Missed Interviews</h2>

            {!interviewData || !interviewData.missed || interviewData.missed.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No missed interviews.
              </div>
            ) : (
              <div className="space-y-4">
                {interviewData.missed.map((item, index) => {
                  const booking = item.booking;
                  const slot = item.slot;
                  const scheduledAt = slot?.slot_datetime || slot?.start_time || booking?.scheduled_at;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm font-medium text-orange-900 dark:text-orange-100">Scheduled Date & Time</div>
                          <div className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {scheduledAt ? formatDateTime(scheduledAt) : 'Interview Scheduled'}
                          </div>
                        </div>

                        <div className="rounded-md border border-orange-300 bg-orange-100 p-3 text-sm text-orange-900 dark:border-orange-700 dark:bg-orange-900 dark:text-orange-100">
                          <strong>⚠️ Missed:</strong> This interview was scheduled but was not attended. Please contact the administrator if you need to reschedule.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Completed Interviews</h2>

            {!interviewData || !interviewData.completed || interviewData.completed.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No completed interviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {interviewData.completed.map((item, index) => {
                  const booking = item.booking;
                  const slot = item.slot;
                  const bookingToken = booking?.token || (typeof booking === 'string' ? booking : null);

                  if (!bookingToken) {
                    debug.warn('Completed interview missing token:', item);
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="font-semibold">
                            {slot?.slot_datetime ? formatDateTime(slot.slot_datetime) :
                              slot?.start_time ? formatDateTime(slot.start_time) :
                                booking?.scheduled_at ? formatDateTime(booking.scheduled_at) :
                                  'Interview Completed'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking?.scheduled_at ?
                              `Completed on ${formatDateDisplay(booking.scheduled_at)}` :
                              'Interview completed'}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/evaluation/${bookingToken}`)}
                          className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          View Evaluation
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

