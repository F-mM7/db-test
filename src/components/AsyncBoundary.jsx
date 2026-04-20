import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';

function AsyncBoundary({ loading, error, children }) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  return children;
}

export default AsyncBoundary;
