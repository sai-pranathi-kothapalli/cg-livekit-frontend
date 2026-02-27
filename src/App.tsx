import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from './components/app/theme-provider';
import { ThemeToggle } from './components/app/theme-toggle';
import { Toaster } from './components/livekit/toaster';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Eager-load critical above-the-fold pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// Route-level code splitting: lazy-load admin/student/interview pages
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ApplyPage = lazy(() => import('./pages/ApplyPage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminJDEditor = lazy(() => import('./pages/AdminJDEditor'));
const AdminEnrollUser = lazy(() => import('./pages/AdminEnrollUser'));
const AdminManageUsers = lazy(() => import('./pages/AdminManageUsers'));
const AdminScheduleInterview = lazy(() => import('./pages/AdminScheduleInterview'));
const AdminManageSlots = lazy(() => import('./pages/AdminManageSlots'));
const AdminGeminiUsagePage = lazy(() => import('./pages/AdminGeminiUsagePage'));
const AdminManageManagers = lazy(() => import('./pages/AdminManageManagers'));
const AdminSystemInstructions = lazy(() => import('./pages/AdminSystemInstructions'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentMyInterviews = lazy(() => import('./pages/StudentMyInterviews'));
const StudentOverallAnalysis = lazy(() => import('./pages/StudentOverallAnalysis'));
const StudentApplicationForm = lazy(() => import('./pages/StudentApplicationForm'));
const InterviewEvaluationPage = lazy(() => import('./pages/InterviewEvaluationPage'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
import { getAppConfig } from './lib/utils';
import { getStyles } from './lib/utils';
import type { AppConfig } from './app-config';
import { APP_CONFIG_DEFAULTS } from './app-config';
import './index.css';

function App() {
  const [_appConfig, setAppConfig] = useState<AppConfig>(APP_CONFIG_DEFAULTS);
  const [styles, setStyles] = useState<string>('');

  useEffect(() => {
    // Load app config on mount
    async function loadConfig() {
      const config = await getAppConfig(null);
      setAppConfig(config);
      setStyles(getStyles(config));

      // Update document title
      document.title = config.pageTitle;

      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', config.pageDescription);
    }
    loadConfig();
  }, []);

  // Apply dynamic styles
  useEffect(() => {
    if (styles) {
      const styleId = 'app-dynamic-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = styles;
      return () => {
        // Cleanup on unmount
        if (styleElement && styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };
    }
  }, [styles]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route path="/interview/:token" element={<InterviewPage />} />
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/jd-editor"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminJDEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/enroll-user"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEnrollUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/slots"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminManageSlots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedule-interview"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminScheduleInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gemini-usage"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminGeminiUsagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-managers"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminManageManagers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-instructions"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSystemInstructions />
                </ProtectedRoute>
              }
            />
            {/* Manager Routes */}
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute requireManager>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/slots"
              element={
                <ProtectedRoute requireManager>
                  <AdminManageSlots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/enroll-user"
              element={
                <ProtectedRoute requireManager>
                  <AdminEnrollUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/manage-users"
              element={
                <ProtectedRoute requireManager>
                  <AdminManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/schedule-interview"
              element={
                <ProtectedRoute requireManager>
                  <AdminScheduleInterview />
                </ProtectedRoute>
              }
            />
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requireStudent>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/jobs"
              element={
                <ProtectedRoute requireStudent>
                  <JobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/apply"
              element={
                <ProtectedRoute requireStudent>
                  <ApplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requireStudent>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/my-interviews"
              element={
                <ProtectedRoute requireStudent>
                  <StudentMyInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/overall-analysis"
              element={
                <ProtectedRoute requireStudent>
                  <StudentOverallAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/application-form"
              element={
                <ProtectedRoute requireStudent>
                  <StudentApplicationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation/:token"
              element={
                <ProtectedRoute>
                  <InterviewEvaluationPage />
                </ProtectedRoute>
              }
            />
            {/* Legacy routes - redirect to student routes */}
            <Route path="/jobs" element={<Navigate to="/student/jobs" replace />} />
            <Route path="/apply" element={<Navigate to="/student/apply" replace />} />
            {/* Other Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
        <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
