import { Component, type ErrorInfo, type ReactNode } from 'react';
import { debug } from '@/lib/debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React render errors and displays a fallback UI instead of crashing.
 * Wrap the app or route tree so unhandled errors are contained.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    debug.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-center text-muted-foreground">
            An unexpected error occurred. Please refresh the page or try again later.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
