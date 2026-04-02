import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordReset, resetPassword } from '@/lib/api';

type Step = 'request' | 'verify';

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ── Step 1: Request OTP ───────────────────────────────────────────────────
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await requestPasswordReset(email.trim().toLowerCase());
            // Always move to Step 2 — backend never reveals if email exists
            setStep('verify');
        } catch (err) {
            setError((err as Error).message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP & Reset Password ───────────────────────────────────
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 12) {
            setError('Password must be at least 12 characters long.');
            return;
        }
        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            setError('Enter the 6-digit code from your email.');
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                new_password: newPassword,
            });

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError((err as Error).message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary';
    const btnClass =
        'w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60';

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">

                {/* Header */}
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                    <p className="text-muted-foreground text-sm">
                        {step === 'request'
                            ? 'Enter your email to receive a verification code.'
                            : `Enter the 6-digit code sent to ${email}`}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${step === 'request' ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
                        {step === 'request' ? '1' : '✓'}
                    </span>
                    <span className={step === 'request' ? 'font-medium text-foreground' : ''}>Send Code</span>
                    <div className="h-px flex-1 bg-border" />
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${step === 'verify' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        2
                    </span>
                    <span className={step === 'verify' ? 'font-medium text-foreground' : ''}>Verify & Reset</span>
                </div>

                {/* Success */}
                {success ? (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                        ✅ Password reset successfully! Redirecting to login...
                    </div>
                ) : step === 'request' ? (

                    /* ── Step 1 Form ── */
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputClass}
                                placeholder="Enter your email"
                                required
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className={btnClass}>
                            {loading ? 'Sending code...' : 'Send Reset Code'}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
                        </div>
                    </form>

                ) : (

                    /* ── Step 2 Form ── */
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="otp" className="text-sm font-medium">Verification Code</label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                pattern="\d{6}"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                                placeholder="000000"
                                required
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                                Code expires in 10 minutes.{' '}
                                <button
                                    type="button"
                                    className="text-primary hover:underline"
                                    onClick={() => { setStep('request'); setOtp(''); setError(null); }}
                                >
                                    Resend
                                </button>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClass}
                                placeholder="At least 12 characters"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass}
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className={btnClass}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
