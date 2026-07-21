import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { logger } from '@/lib/logging/logger';

interface Props {
  children: ReactNode;
  /** Optional custom fallback renderer. */
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global error boundary. Catches render-time errors, logs a technical message
 * (no personal data) and shows a friendly recovery screen. The `reset` action
 * clears the error so the user can retry without a full reload.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('react_error_boundary', {
      name: error.name,
      hasComponentStack: Boolean(info.componentStack),
    });
  }

  reset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.reset);
      return <ErrorFallback onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
