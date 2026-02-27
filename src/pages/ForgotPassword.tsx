import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '@/lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                email,
                new_password: newPassword,
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError((err as Error).message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
                    <p className="text-muted-foreground">
                        Enter your email and a new password
                    </p>
                </div>

                {success ? (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                        Password reset successfully! Redirecting to login page...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="newPassword" className="text-sm font-medium">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
                                placeholder="Enter new password"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-primary hover:underline">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
