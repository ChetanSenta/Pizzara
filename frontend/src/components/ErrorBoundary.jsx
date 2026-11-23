import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="route-error page container">
          <div>
            <h1>Something went wrong</h1>
            <p>Please refresh and try again.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
