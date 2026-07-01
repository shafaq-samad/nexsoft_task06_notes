import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
          <h1 className="text-2xl font-semibold text-primary">Something went wrong</h1>
          <p className="max-w-md text-sm text-on-surface-variant">The app hit an unexpected error. Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
