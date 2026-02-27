import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { App } from '@/components/app/app';
import { getBooking, getInterviewAccessConfig } from '@/lib/api/bookings';
import { getAppConfig } from '@/lib/utils';
import { debug } from '@/lib/debug';
import type { AppConfig } from '@/app-config';
import { APP_CONFIG_DEFAULTS } from '@/app-config';
import { PreInterviewChecks } from '@/components/pre-interview/PreInterviewChecks';
import { useAuth } from '@/contexts/AuthContext';

export default function InterviewPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isStudent, isLoading: authLoading, user } = useAuth();
  const [checksPassed, setChecksPassed] = useState(false);

  useEffect(() => {
    console.log('[Frontend] 🏗️ InterviewPage mounted', { token });
    return () => console.log('[Frontend] 🚮 InterviewPage unmounted');
  }, [token]);

  const [appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG_DEFAULTS);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requireLoginForInterview, setRequireLoginForInterview] = useState<boolean | null>(null);

  // Fetch public config: does interview link require login?
  useEffect(() => {
    if (!token) return;
    getInterviewAccessConfig()
      .then((c) => setRequireLoginForInterview(c.require_login_for_interview))
      .catch(() => setRequireLoginForInterview(true)); // default to secure on error
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Token is required');
      setLoading(false);
      return;
    }

    // Wait for interview config to be loaded
    if (requireLoginForInterview === null) {
      return;
    }

    // When login is required, wait for auth and enforce it
    if (requireLoginForInterview) {
      if (authLoading) return;
      if (!isAuthenticated || !isStudent) {
        setError('authentication_required');
        setLoading(false);
        setTimeout(() => {
          navigate('/login', { state: { redirect: `/interview/${token}` } });
        }, 2000);
        return;
      }
    }

    async function loadData() {
      setLoading(true);
      try {
        // Load app config (client-side, no headers needed)
        const config = await getAppConfig(null);
        setAppConfig(config);

        // Get booking (backend allows without auth when REQUIRE_LOGIN_FOR_INTERVIEW=false)
        const bookingData = await getBooking(token!);

        if (!bookingData) {
          setError('Interview not found');
          setLoading(false);
          return;
        }

        // Set booking state FIRST so we can display scheduled time even if there's an error
        setBooking(bookingData);

        // Require application form to be submitted before attending interview
        if (bookingData.application_form_submitted === false) {
          setError('application_form_required');
          setLoading(false);
          return;
        }

        // Check if interview window is valid (can only join during the scheduled interview time)
        const scheduledAt = new Date(bookingData.scheduled_at);
        const now = new Date();

        // Get interview duration from slot or default to 30 minutes
        let durationMinutes = 30;
        if (bookingData.slot?.duration_minutes) {
          durationMinutes = bookingData.slot.duration_minutes;
        } else if (bookingData.slot?.slot_datetime) {
          // Calculate duration from slot start and end times if available
          const slotStart = new Date(bookingData.slot.slot_datetime);
          const slotEnd = bookingData.slot.end_time ? new Date(bookingData.slot.end_time) : null;
          if (slotEnd) {
            durationMinutes = Math.round((slotEnd.getTime() - slotStart.getTime()) / 60000);
          }
        }

        const interviewEndTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

        // Check if current time is before scheduled time
        if (now < scheduledAt) {
          setError('interview_too_early');
          setLoading(false);
          return;
        }

        // Check if current time is after interview end time
        if (now > interviewEndTime) {
          setError('interview_expired');
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err: any) {
        debug.error('[InterviewPage] Error:', err);
        // Handle authentication errors
        if (err.message?.includes('401') || err.message?.includes('Authentication required')) {
          setError('authentication_required');
          setTimeout(() => {
            navigate('/login', { state: { redirect: `/interview/${token}` } });
          }, 2000);
        } else if (err.message?.includes('403') || err.message?.includes('permission')) {
          setError('access_denied');
        } else {
          setError('Failed to load interview');
        }
        setLoading(false);
      }
    }

    loadData();
  }, [token, requireLoginForInterview, isAuthenticated, isStudent, authLoading, navigate]);

  const isLoading =
    loading ||
    requireLoginForInterview === null ||
    (requireLoginForInterview === true && authLoading);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </main>
    );
  }

  if (error === 'authentication_required') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Authentication Required</h1>
          <p className="text-sm text-muted-foreground">
            You must be logged in as a student to access this interview.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </main>
    );
  }

  if (error === 'application_form_required') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Application Form Required</h1>
          <p className="text-sm text-muted-foreground">
            You must complete and submit your application form before you can attend the interview.
          </p>
          <p className="text-sm text-muted-foreground">
            Go to Application Form in your dashboard, fill it in, and submit. Then return to this link to join the interview.
          </p>
          <button
            type="button"
            onClick={() => navigate(isStudent ? '/student/application-form' : '/login', { state: { redirect: `/interview/${token}` } })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isStudent ? 'Go to Application Form' : 'Log in and go to Application Form'}
          </button>
        </div>
      </main>
    );
  }

  if (error === 'access_denied') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this interview.
          </p>
          <p className="text-sm text-muted-foreground">
            This interview belongs to a different student.
          </p>
        </div>
      </main>
    );
  }

  if (error === 'Interview not found') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Interview not found</h1>
          <p className="text-sm text-muted-foreground">
            The interview link is invalid or has expired.
          </p>
        </div>
      </main>
    );
  }

  if (error === 'interview_too_early') {
    const scheduledAt = booking ? new Date(booking.scheduled_at) : new Date();
    const formattedDate = scheduledAt.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Your interview has not started yet</h1>
          <p className="text-sm text-muted-foreground">
            Scheduled for {formattedDate} (IST).
          </p>
          <p className="text-sm text-muted-foreground">
            Please join at the scheduled time. The interview link is only accessible during the scheduled interview time window.
          </p>
        </div>
      </main>
    );
  }

  if (error === 'interview_expired') {
    const scheduledAt = booking ? new Date(booking.scheduled_at) : new Date();
    const durationMinutes = booking?.slot?.duration_minutes || 30;
    const interviewEndTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    const formattedStart = scheduledAt.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    const formattedEnd = interviewEndTime.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Interview window has expired</h1>
          <p className="text-sm text-muted-foreground">
            The interview was scheduled from {formattedStart} to {formattedEnd} (IST).
          </p>
          <p className="text-sm text-muted-foreground">
            The interview link is only accessible during the scheduled time window. Please contact support to reschedule.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  // 1. Show pre-interview checks if not passed yet
  if (!checksPassed) {
    return (
      <PreInterviewChecks
        userName={user?.name || "Candidate"}
        onAllChecksPassed={() => setChecksPassed(true)}
      />
    );
  }

  // 2. Render LiveKit app once checks pass
  return (
    <App
      appConfig={appConfig}
      interviewToken={token || undefined}
      interviewDuration={booking?.slot?.duration_minutes || booking?.duration_minutes || 30}
      scheduledAt={booking?.scheduled_at}
    />
  );
}
