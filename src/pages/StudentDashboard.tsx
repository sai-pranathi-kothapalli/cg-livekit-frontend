import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/StudentLayout';
import { getStudentAnalytics, type StudentAnalyticsResponse } from '@/lib/api';
import { debug } from '@/lib/debug';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StudentAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getStudentAnalytics();
      setAnalytics(data);
    } catch (err) {
      debug.error('Failed to load analytics:', err);
      // Don't show error to user, just don't show analytics
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome, {user?.name || user?.email || 'Student'}! 👋
              </h1>
              <p className="text-muted-foreground">
                Manage your resume and track your progress here.
              </p>
            </div>
            {analytics && analytics.total_interviews > 0 && (
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <span className="text-sm font-medium text-primary">Interviews Completed: </span>
                <span className="text-xl font-bold text-primary ml-1">{analytics.total_interviews}</span>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {!loadingAnalytics && analytics && analytics.total_interviews > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Communication</span>
                    <span className="text-sm font-bold">{analytics.average_scores.communication.toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(analytics.average_scores.communication / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Technical Details</span>
                    <span className="text-sm font-bold">{analytics.average_scores.technical.toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(analytics.average_scores.technical / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Problem Solving</span>
                    <span className="text-sm font-bold">{analytics.average_scores.problem_solving.toFixed(1)}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(analytics.average_scores.problem_solving / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-border mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Overall Average</span>
                    <span className="text-lg font-bold text-primary">{analytics.average_scores.overall.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Feedback Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-100 dark:border-green-900">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span>💪</span> Top Strengths
                  </h3>
                  <ul className="text-sm space-y-1 text-green-800 dark:text-green-300">
                    {analytics.recent_strengths.length > 0 ? (
                      analytics.recent_strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="italic opacity-70">See detailed feedback in your interview reports</li>
                    )}
                  </ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-900">
                  <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                    <span>📈</span> Areas to Improve
                  </h3>
                  <ul className="text-sm space-y-1 text-orange-800 dark:text-orange-300">
                    {analytics.recent_improvements.length > 0 ? (
                      analytics.recent_improvements.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="italic opacity-70">Keep practicing to identify improvement areas</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Progress Analysis Section */}
        {!loadingAnalytics && analytics && analytics.total_interviews >= 2 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>📈</span> Overall Progress Analysis
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Score Trend Chart */}
              <div className="lg:col-span-1 bg-muted/30 p-4 rounded-xl border border-border/50">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">Score Trend</h3>
                <div className="h-40 w-full relative px-2">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 10, 20, 30, 40].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.5" />
                    ))}

                    {/* Data Line */}
                    {analytics.history.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={analytics.history.map((h, i) => `${(i / (analytics.history.length - 1)) * 100},${40 - (h.score * 4)}`).join(' ')}
                      />
                    )}

                    {/* Points */}
                    {analytics.history.map((h, i) => (
                      <circle
                        key={i}
                        cx={analytics.history.length > 1 ? (i / (analytics.history.length - 1)) * 100 : 50}
                        cy={40 - (h.score * 4)}
                        r="3"
                        fill="rgb(59, 130, 246)"
                        className="hover:r-4 transition-all cursor-crosshair"
                      >
                        <title>Score: {h.score}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
                    <span>Start</span>
                    <span>Current</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis Text */}
              <div className="lg:col-span-2 flex flex-col justify-center">
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 relative">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl text-primary/40 pt-1">“</div>
                    <p className="text-foreground leading-relaxed italic text-lg pr-4">
                      {analytics.overall_analysis || "You're making great progress! Complete more interviews to get a detailed AI-powered overall progress analysis based on your performance trends."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Resume Card */}
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/student/application-form')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Resume</h3>
                <p className="text-sm text-muted-foreground">Fill or upload your resume</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Complete your RRB PO resume and details to proceed with interview slot selection.
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

