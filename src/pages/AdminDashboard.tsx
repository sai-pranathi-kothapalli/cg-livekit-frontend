import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-muted-foreground">
            Manage job descriptions, enroll users, and manage the enrolled user database.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Edit Job Description Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <div className="mb-2 text-2xl">📝</div>
              <h2 className="text-xl font-semibold">Edit Job Description</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Update the job posting details, requirements, and preparation areas.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/jd-editor')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Edit JD
            </button>
          </div>

          {/* Manage Managers Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <div className="mb-2 text-2xl">👔</div>
              <h2 className="text-xl font-semibold">Manage Managers</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enroll and manage interviewer/manager accounts for your interview platform.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/manage-managers')}
              className="mt-4 w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Manage Managers
            </button>
          </div>

          {/* Enroll User Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <div className="mb-2 text-2xl">👤</div>
              <h2 className="text-xl font-semibold">Enroll User</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enroll a single user or bulk enroll multiple users from an Excel file.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/enroll-user')}
              className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
            >
              Enroll User
            </button>
          </div>

          {/* Manage Users Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <div className="mb-2 text-2xl">📋</div>
              <h2 className="text-xl font-semibold">Manage Users</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                View, edit, and delete enrolled users. Update user status and notes.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/manage-users')}
              className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
            >
              Manage Users
            </button>
          </div>

          {/* Schedule Interview Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <div className="mb-2 text-2xl">📅</div>
              <h2 className="text-xl font-semibold">Schedule Interview</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Schedule interviews for enrolled users. Single or bulk scheduling options available.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/schedule-interview')}
              className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Schedule Interview
            </button>
          </div>

          {/* Gemini Usage Card */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm transition hover:shadow-md dark:border-blue-800 dark:bg-blue-950/20">
            <div className="mb-4">
              <div className="mb-2 text-2xl">💎</div>
              <h2 className="text-xl font-semibold">Gemini Usage</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Monitor token usage across all interview sessions. Track input, output, and cumulative costs.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/gemini-usage')}
              className="mt-4 w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Check Gemini Usage
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

