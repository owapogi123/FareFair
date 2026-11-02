'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CinematicErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CinematicErrorBoundary] WebGL/Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="fixed inset-0 z-0 flex items-center justify-center bg-[var(--ff-bg)] p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="text-center max-w-sm">
            <svg
              className="mx-auto h-12 w-12 text-[var(--ff-text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-[var(--ff-text)]">3D experience unavailable</h3>
            <p className="mt-1 text-xs text-[var(--ff-text-muted)]">
              The interactive scene couldn't load. The page content below still works normally.
            </p>
            {this.state.error && (
              <details className="mt-3 text-left text-[2xs] text-[var(--ff-text-muted)]">
                <summary className="cursor-pointer select-none">Error details</summary>
                <pre className="mt-2 p-2 rounded bg-[var(--ff-surface)] overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}