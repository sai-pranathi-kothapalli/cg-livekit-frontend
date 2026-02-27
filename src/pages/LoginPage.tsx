import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type User } from '@/contexts/AuthContext';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login({
        username: credentials.username,
        password: credentials.password,
      });

      if (response.success && response.token && response.user) {
        const user: User = {
          ...response.user,
          role: response.user.role as 'admin' | 'manager' | 'student',
        };
        authLogin(user, response.token);

        // Navigate based on role
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (response.user.role === 'manager') {
          navigate('/manager/dashboard');
        } else {
          // Check if password change is required
          if (response.must_change_password) {
            navigate('/change-password');
          } else {
            navigate('/student/dashboard');
          }
        }
      } else {
        setError(response.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="text-muted-foreground">
            Enter your credentials to continue
          </p>
          <p className="text-xs text-muted-foreground">
            Use username for admin or email for student
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username / Email
            </label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
              placeholder="Enter username or email"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 focus-visible:border-primary"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
