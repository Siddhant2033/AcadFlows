import React from 'react';
import { Button } from './ui';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Top-level React error boundary.
 * Catches render/lifecycle errors anywhere in the tree and shows a friendly
 * fallback instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 Error boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-2xl w-full">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-red-500/10 text-2xl">
                ⚠️
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  Something went wrong
                </h1>
                <p className="mt-1 text-sm text-muted">
                  An unexpected error occurred. Your data is safe — try
                  refreshing or going back to the dashboard.
                </p>

                {isDev && this.state.error && (
                  <details className="mt-4 rounded-lg bg-elevated p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Technical details (dev only)
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-red-600 dark:text-red-400">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="primary" onClick={this.handleReset}>
                    Try again
                  </Button>
                  <Button variant="outline" onClick={this.handleReload}>
                    Go to home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;