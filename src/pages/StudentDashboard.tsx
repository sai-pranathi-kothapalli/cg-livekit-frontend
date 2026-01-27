import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user?.name || user?.email || 'Student'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your job applications and track your progress here.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Available Jobs Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/student/jobs')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="text-3xl">💼</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Available Jobs</h3>
                <p className="text-sm text-muted-foreground">Browse job openings</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Explore available job positions and find opportunities that match your skills.
            </p>
          </div>

          {/* Apply for Job Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/student/apply')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <span className="text-3xl">📝</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Apply for Job</h3>
                <p className="text-sm text-muted-foreground">Submit your application</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Fill out the application form and submit your details for consideration.
            </p>
          </div>

          {/* Application Form Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/student/application-form')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Application Form</h3>
                <p className="text-sm text-muted-foreground">Fill or upload your form</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Complete your RRB PO application form to proceed with interview slot selection.
            </p>
          </div>

          {/* My Interviews Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/student/my-interviews')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <span className="text-3xl">📅</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">My Interviews</h3>
                <p className="text-sm text-muted-foreground">Manage your interviews</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              View assigned slots, schedule your interview, and access interview links.
            </p>
          </div>

          {/* My Profile Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/student/profile')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">My Profile</h3>
                <p className="text-sm text-muted-foreground">View your information</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              View and update your profile information and account settings.
            </p>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-medium text-foreground">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium text-foreground">{user?.email || 'Not set'}</p>
            </div>
            {user?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-lg font-medium text-foreground">{user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-lg font-medium text-foreground capitalize">{user?.role || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

