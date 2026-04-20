import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">💥</div>
            <h2 className="error-title">申し訳ございません</h2>
            <p className="error-message">
              予期しないエラーが発生しました。ページを再読み込みしてください。
            </p>
            <button
              className="btn btn-success error-reload-btn"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-details">
                <summary>技術的な詳細 (開発モードのみ)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
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

export default ErrorBoundary;