function ErrorDisplay({ error, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-text">
        データの読み込みに失敗しました
        <div className="error-detail">{error}</div>
      </div>
      <button className="retry-button" onClick={onRetry}>
        再試行
      </button>
    </div>
  );
}

export default ErrorDisplay;