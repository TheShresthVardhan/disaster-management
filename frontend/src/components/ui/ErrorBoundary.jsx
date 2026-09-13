import { Component } from 'react';

/**
 * Catches render crashes (e.g. machine-translation tools rewriting live
 * form text nodes, which React cannot reconcile) and shows a recoverable
 * message instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger" role="alert">
          <strong>Something went wrong on this step.</strong>
          <p className="mb-2 small">
            If the page is translated, the translator can occasionally break interactive
            forms. Switch back to “Show original”, then reload to continue.
          </p>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
