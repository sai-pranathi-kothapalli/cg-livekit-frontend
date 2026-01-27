import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { App } from '@/components/app/app';
import { getBooking } from '@/lib/api';
import { getAppConfig } from '@/lib/utils';
import type { AppConfig } from '@/app-config';
import { APP_CONFIG_DEFAULTS } from '@/app-config';

export default function InterviewPage() {
  const { token } = useParams<{ token: string }>();
  const [appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG_DEFAULTS);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token is required');
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        // Load app config (client-side, no headers needed)
        const config = await getAppConfig(null);
        setAppConfig(config);

        // Get booking from backend
        // Token is already checked above, but TypeScript needs non-null assertion
        const bookingData = await getBooking(token!);
        
        if (!bookingData) {
          setError('Interview not found');
          setLoading(false);
          return;
        }

        // Check if interview window is valid (can join from scheduled time to 1 hour after)
        const scheduledAt = new Date(bookingData.scheduled_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - scheduledAt.getTime()) / 60000;

        // [DEVELOPMENT BYPASS] Allow joining even if expired
        // Check if current time is more than 1 hour after scheduled time
        // if (diffMinutes > 60) {
        //   setError('interview_expired');
        //   setLoading(false);
        //   return;
        // }

        setBooking(bookingData);
        setLoading(false);
      } catch (err) {
        console.error('[InterviewPage] Error:', err);
        setError('Failed to load interview');
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading interview...</p>
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
            Please join at the scheduled time. You can access the interview from the scheduled time up to 1 hour after.
          </p>
        </div>
      </main>
    );
  }

  if (error === 'interview_expired') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-semibold">Interview window has expired</h1>
          <p className="text-sm text-muted-foreground">
            This link is no longer active. Please contact support to reschedule.
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

  // Render LiveKit app
  return <App appConfig={appConfig} interviewToken={token || undefined} />;
}
