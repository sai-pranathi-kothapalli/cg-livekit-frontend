import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface StudentLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/student/my-interviews', label: 'My Interviews', icon: '📅' },
  { path: '/student/application-form', label: 'Application Form', icon: '📄' },
];

export default function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } border-r border-border bg-card transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen && (
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <img
                src="/sreedhar-logo.png"
                alt="Sreedhar CCE Logo"
                className="h-8 w-auto object-contain"
              />
              <h1 className="text-lg font-bold">Student Portal</h1>
            </Link>
          )}
          {!sidebarOpen && (
            <img
              src="/sreedhar-logo.png"
              alt="Sreedhar CCE Logo"
              className="h-8 w-auto object-contain mx-auto"
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                    }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-border p-4">
          {sidebarOpen && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {navItems.find((item) => isActive(item.path))?.label || 'Student Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome to your student portal
              </p>
            </div>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Open sidebar"
              >
                ☰
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

