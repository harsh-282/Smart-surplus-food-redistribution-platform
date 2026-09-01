const LoadingSpinner = ({ fullscreen = false, text = 'Loading...' }) => {
  if (fullscreen) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</p>
      </div>
    );
  }
  return (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  );
};

export default LoadingSpinner;
