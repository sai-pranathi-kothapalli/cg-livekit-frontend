import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider } from './components/app/theme-provider';
import { ThemeToggle } from './components/app/theme-toggle';
import { Toaster } from './components/livekit/toaster';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import JobsPage from './pages/JobsPage';
import ApplyPage from './pages/ApplyPage';
import InterviewPage from './pages/InterviewPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminJDEditor from './pages/AdminJDEditor';
import AdminEnrollUser from './pages/AdminEnrollUser';
import AdminManageUsers from './pages/AdminManageUsers';
import AdminScheduleInterview from './pages/AdminScheduleInterview';
import AdminManageSlots from './pages/AdminManageSlots';
import UserApplicationForm from './pages/UserApplicationForm';
import UserApplicationView from './pages/UserApplicationView';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentMyInterviews from './pages/StudentMyInterviews';
import StudentApplicationForm from './pages/StudentApplicationForm';
import InterviewEvaluationPage from './pages/InterviewEvaluationPage';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import { ProtectedRoute } from './components/ProtectedRoute';
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
        <Route path="/user/application" element={<UserApplicationForm />} />
        <Route path="/user/application/view" element={<UserApplicationView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
        <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
