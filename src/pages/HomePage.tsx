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
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/60 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <a
            href="https://codegnan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
          >
            <img
              src="/sreedhar-logo.png"
              alt="Codegnan Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">
                Codegnan AI Interview Platform
              </span>
              <span className="text-xs text-muted-foreground">
                AI-powered mock interviews for modern careers
              </span>
            </div>
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
      <section className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Codegnan AI Interview Platform
          </h1>
          <p className="mb-4 text-lg md:text-xl text-muted-foreground">
            Experience real-time AI-powered mock interviews designed to prepare you for technical, HR, and placement interviews.
          </p>
          <p className="mb-10 text-base md:text-lg text-muted-foreground">
            Practice like it&apos;s the real interview with adaptive AI, structured rounds, and instant feedback to accelerate your career growth.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleGetStarted}
              className="rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Start Interview
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="rounded-md border border-border bg-background px-8 py-3 text-base font-semibold text-foreground transition hover:bg-accent"
            >
              Explore Interviews
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-background/60 py-16">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Platform Features
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl duration-300">
                <div className="mb-4 text-3xl">🤖</div>
                <h3 className="mb-2 text-xl font-semibold">AI-Powered Interviews</h3>
                <p className="text-muted-foreground">
                  Real-time adaptive interviews tailored to your resume, role, and current skill level.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl duration-300">
                <div className="mb-4 text-3xl">💻</div>
                <h3 className="mb-2 text-xl font-semibold">Technical &amp; HR Rounds</h3>
                <p className="text-muted-foreground">
                  Practice coding, system design, and behavioral interviews in structured multi-round flows.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl duration-300">
                <div className="mb-4 text-3xl">📊</div>
                <h3 className="mb-2 text-xl font-semibold">Instant Performance Feedback</h3>
                <p className="text-muted-foreground">
                  Get structured evaluation reports with scores, strengths, and clear improvement suggestions.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl duration-300">
                <div className="mb-4 text-3xl">🎓</div>
                <h3 className="mb-2 text-xl font-semibold">Placement Preparation</h3>
                <p className="text-muted-foreground">
                  Built for students preparing for campus placements and job interviews across domains.
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
                <h3 className="mb-1 text-lg font-semibold">Resume Upload</h3>
                <p className="text-muted-foreground">
                  Upload your resume so our AI can generate a personalized interview tailored to your profile.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">Technical Round</h3>
                <p className="text-muted-foreground">
                  Answer skill-based questions generated from your resume, role, and target technology stack.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">HR &amp; Behavioral Round</h3>
                <p className="text-muted-foreground">
                  Practice situational, communication, and culture-fit questions in a realistic HR-style conversation.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h3 className="mb-1 text-lg font-semibold">AI Feedback Report</h3>
                <p className="text-muted-foreground">
                  Receive detailed performance analytics with scores, insights, and next steps to improve.
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
              Join Codegnan&apos;s AI Interview Platform and get ready for your next technical, HR, or placement interview.
            </p>
            <button
              onClick={handleGetStarted}
              className="rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start Interview Now'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/80 py-8 backdrop-blur">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/sreedhar-logo.png"
                alt="Codegnan Logo"
                className="h-16 w-auto object-contain"
              />
              <span className="text-sm text-muted-foreground">
                Codegnan - AI Powered Career Platform
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <a
                href="https://codegnan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition"
              >
                About Us
              </a>
              <a
                href="https://codegnan.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition"
              >
                Contact
              </a>
              <a
                href="https://codegnan.com/careers"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition"
              >
                Careers
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
            <p>© 2026 Codegnan IT Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
