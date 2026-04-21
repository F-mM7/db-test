import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // fallback UI に必要な情報は getDerivedStateFromError で一度に返す（React 公式推奨）
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // componentDidCatch は副作用（ロギング）と errorInfo の保存のみに専念
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
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