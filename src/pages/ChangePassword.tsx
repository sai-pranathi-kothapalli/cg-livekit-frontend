import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, getUserData } from '@/lib/api';

export default function ChangePassword() {
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const userData = getUserData();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (form.newPassword !== form.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (form.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!userData || !userData.email) {
            setError('User session not found. Please log in again.');
            return;
        }

        setLoading(true);

        try {
            await changePassword({
                email: userData.email,
                old_password: form.oldPassword,
                new_password: form.newPassword,
            });

            setSuccess(true);
            // Clear must_change_password flag in local storage if possible, 
            // though the backend already did it on DB. 
            // Refreshing user data would be best.
            if (userData) {
                userData.must_change_password = false;
                localStorage.setItem('userData', JSON.stringify(userData));
            }

            setTimeout(() => {
                navigate('/student/dashboard');
            }, 2000);
        } catch (err) {
            setError((err as Error).message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Change Password</h1>
                    <p className="text-muted-foreground">
                        You must change your temporary password to continue
                    </p>
                </div>

                {success ? (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                        Password changed successfully! Redirecting to dashboard...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="oldPassword" className="text-sm font-medium">
                                Current (Temporary) Password
                            </label>
                            <input
                                id="oldPassword"
                                type="password"
                                value={form.oldPassword}
                                onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
                                placeholder="Enter current password"
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
                                value={form.newPassword}
                                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
