import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { getMyInterview, selectSlot, getApplicationForm, type MyInterviewResponse, type ApplicationFormResponse } from '@/lib/api';

export default function StudentMyInterviews() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'enrolled' | 'scheduled' | 'completed'>('enrolled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<MyInterviewResponse | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormResponse | null>(null);
  const [checkingForm, setCheckingForm] = useState(true);

  useEffect(() => {
    loadInterviewData();
    checkApplicationForm();
  }, []);

  const checkApplicationForm = async () => {
    try {
      setCheckingForm(true);
      const form = await getApplicationForm();
      setApplicationForm(form);
    } catch (err) {
      console.error('Failed to check application form:', err);
    } finally {
      setCheckingForm(false);
    }
  };

  const loadInterviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyInterview();
      setInterviewData(data);

      // Auto-switch to scheduled tab if user has a scheduled interview
      if (data.scheduled) {
        setActiveTab('scheduled');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = async (assignmentId: string) => {
    // Check if application form is completed
    if (!applicationForm || applicationForm.status !== 'submitted') {
      const proceed = confirm(
        'You need to complete and submit your application form before selecting a slot. Would you like to go to the application form page now?'
      );
      if (proceed) {
        navigate('/student/application-form');
      }
      return;
    }

    if (!confirm('Are you sure you want to select this time slot? This action cannot be undone.')) {
      return;
    }

    try {
      setSelectingSlot(assignmentId);
      setError(null);
      const result = await selectSlot({ assignment_id: assignmentId });

      // Reload data to refresh UI
      await loadInterviewData();

      // Show success message
      alert(`Slot selected successfully! Interview URL: ${result.interviewUrl}`);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);

      // If error mentions application form, offer to navigate
      if (errorMessage.toLowerCase().includes('application form')) {
        const proceed = confirm('Would you like to complete your application form now?');
        if (proceed) {
          navigate('/student/application-form');
        }
      }
    } finally {
      setSelectingSlot(null);
    }
  };

  // Format date and time
  const formatDateDisplay = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
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
      // Format time in 12-hour format with AM/PM
      return date.toLocaleTimeString('en-US', {
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
              onClick={() => setActiveTab('enrolled')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'enrolled'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Enrolled {interviewData?.enrolled.length ? `(${interviewData.enrolled.length})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'scheduled'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Scheduled {interviewData?.scheduled ? '(1)' : '(0)'}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                }`}
            >
              Completed {interviewData?.completed.length ? `(${interviewData.completed.length})` : ''}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'enrolled' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Available Time Slots</h2>

            {/* Application Form Requirement Warning */}
            {!checkingForm && (!applicationForm || applicationForm.status !== 'submitted') && (
              <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <strong className="block mb-1">⚠️ Application Form Required</strong>
                    <p className="mb-2">
                      You must complete and submit your application form before you can select an interview slot.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/student/application-form')}
                    className="ml-4 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                  >
                    Complete Form
                  </button>
                </div>
              </div>
            )}

            <p className="mb-4 text-sm text-muted-foreground">
              Please select a convenient time slot from the options below. Once selected, you'll receive the interview link.
            </p>

            {!interviewData || interviewData.enrolled.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No slots assigned. Please contact the administrator.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviewData.enrolled.map((assignment) => {
                  const slot = assignment.slot;
                  const available = slot.max_capacity - slot.current_bookings;
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="font-semibold text-lg">
                          {formatDateDisplay(slot.slot_datetime)}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatSlotTime(slot.slot_datetime)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {available} of {slot.max_capacity} spots available
                        </div>
                        <button
                          onClick={() => handleSelectSlot(assignment.id)}
                          disabled={
                            selectingSlot === assignment.id ||
                            available === 0 ||
                            !applicationForm ||
                            applicationForm.status !== 'submitted'
                          }
                          className="w-full mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          title={
                            !applicationForm || applicationForm.status !== 'submitted'
                              ? 'Please complete your application form first'
                              : available === 0
                                ? 'Slot is full'
                                : 'Select this time slot'
                          }
                        >
                          {selectingSlot === assignment.id
                            ? 'Selecting...'
                            : available === 0
                              ? 'Full'
                              : !applicationForm || applicationForm.status !== 'submitted'
                                ? 'Complete Form First'
                                : 'Select This Slot'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Scheduled Interview</h2>

            {!interviewData || !interviewData.scheduled ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No interview scheduled yet. Please select a time slot from the "Enrolled" tab.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Interview Date & Time</div>
                      <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {interviewData.scheduled.slot
                          ? formatDateTime(interviewData.scheduled.slot.slot_datetime)
                          : formatDateTime(interviewData.scheduled.booking.scheduled_at)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Interview Link</div>
                      <div className="mt-2">
                        <a
                          href={interviewData.scheduled.booking.interview_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block break-all rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                        >
                          Join Interview
                        </a>
                      </div>
                      <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                        {interviewData.scheduled.booking.interview_url}
                      </div>
                    </div>

                    <div className="rounded-md border border-blue-300 bg-blue-100 p-3 text-sm text-blue-900 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100">
                      <strong>⚠️ Important:</strong> Please join the interview 5 minutes before the scheduled time. The link will be active from 5 minutes before until 1 hour after the scheduled time.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Completed Interviews</h2>

            {!interviewData || interviewData.completed.length === 0 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                No completed interviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {interviewData.completed.map((item, index) => {
                  const booking = item.booking;
                  const slot = item.slot;
                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="font-semibold">
                          {slot ? formatDateTime(slot.slot_datetime) : 'Interview Completed'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed on {new Date(booking.created_at).toLocaleDateString()}
                        </div>
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

