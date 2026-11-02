'use client';

import { Component, type ReactNode } from 'react';
import { ScrollProgress } from './ScrollProgress';

/**
 * Error boundary for ScrollProgress component.
 * ScrollProgress is a decorative enhancement - its failure must not
 * take down the complete application.
 */
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScrollProgressErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for developers but don't crash the app
    console.error('[ScrollProgressErrorBoundary] Scroll progress animation failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing - scroll progress is decorative only
      return null;
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that provides graceful degradation for ScrollProgress.
 * If ScrollProgress fails to initialize, the rest of the page remains functional.
 */
export function ScrollProgressWrapper() {
  return (
    <ScrollProgressErrorBoundary>
      <ScrollProgress />
    </ScrollProgressErrorBoundary>
  );
}