import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'Unexpected interface error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-root" style={{ paddingTop: 48 }}>
          <div className="card stack-md" role="alert">
            <h1 className="section-title">Something slipped out of sync</h1>
            <p className="muted">{this.state.message}</p>
            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  window.location.href = '/?view=home';
                }}
              >
                Reload Home Studio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
