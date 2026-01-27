import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isStudent } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else if (isStudent) {
        navigate('/student/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <a
            href="https://sreedharscce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
          >
            <img
              src="/sreedhar-logo.png"
              alt="Sreedhar CCE Logo"
              className="h-20 w-auto object-contain"
            />
          </a>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Welcome to Sreedhar CCE
            <br />
            <span className="text-primary">Interview Platform</span>
          </h1>
          <p className="mb-4 text-xl text-muted-foreground">
            Results Super Star
          </p>
          <p className="mb-8 text-lg text-muted-foreground">
            Professional interview platform for Regional Rural Bank Probationary Officer (PO) positions.
            <br />
            Experience seamless, AI-powered interviews designed to help you succeed.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleGetStarted}
              className="rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="rounded-md border border-border bg-background px-8 py-3 text-base font-semibold text-foreground transition hover:bg-accent"
            >
              View Jobs
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Platform Features
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 text-3xl">🎯</div>
                <h3 className="mb-2 text-xl font-semibold">Structured Interviews</h3>
                <p className="text-muted-foreground">
                  Professional, structured interview process covering all key areas including
                  banking knowledge, general knowledge, and domain expertise.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 text-3xl">💼</div>
                <h3 className="mb-2 text-xl font-semibold">RRB PO Focus</h3>
                <p className="text-muted-foreground">
                  Specialized for Regional Rural Bank Probationary Officer positions with
                  comprehensive evaluation across all required competencies.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 text-3xl">📊</div>
                <h3 className="mb-2 text-xl font-semibold">Professional Assessment</h3>
                <p className="text-muted-foreground">
                  Get detailed feedback on your performance to help you improve and
                  prepare for your banking career.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interview Process Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">
            Interview Process
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Self Introduction</h3>
                <p className="text-muted-foreground">
                  Share your background, education, and motivation for joining the banking sector.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">General Knowledge & Current Affairs</h3>
                <p className="text-muted-foreground">
                  Demonstrate your awareness of current events, government schemes, and political leaders.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Domain Knowledge</h3>
                <p className="text-muted-foreground">
                  Showcase your technical knowledge and how it applies to banking operations.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Banking & RRB Knowledge</h3>
                <p className="text-muted-foreground">
                  Core assessment of banking concepts, RBI functions, and Regional Rural Bank knowledge.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                5
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Situational & Feedback</h3>
                <p className="text-muted-foreground">
                  Practical scenario-based questions followed by comprehensive feedback on your performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/5 py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Start Your Interview?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join Sreedhar CCE's interview platform and take the next step in your banking career.
            </p>
            <button
              onClick={handleGetStarted}
              className="rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/sreedhar-logo.png"
                alt="Sreedhar CCE Logo"
                className="h-16 w-auto object-contain"
              />
              <span className="text-sm text-muted-foreground">
                Sreedhar CCE - Results Super Star
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <a
                href="https://sreedharscce.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition"
              >
                Visit Website
              </a>
              <button
                onClick={() => navigate('/jobs')}
                className="hover:text-foreground transition"
              >
                View Jobs
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-foreground transition"
              >
                Login
              </button>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Sreedhar CCE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
