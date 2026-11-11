import { Component } from 'react';
import { useLocation } from 'react-router-dom';

// Catches render errors so a bug shows a way forward instead of a blank page.
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="tab-content" role="alert">
        <h1>Something went wrong</h1>
        <p>This page hit an error. Your saved letters are safe; reloading usually fixes it.</p>
        <div className="cta-row">
          <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a className="secondary-link" href="/">
            Go to Home
          </a>
        </div>
      </section>
    );
  }
}

// Keyed by path so moving to another page clears the error.
export default function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
