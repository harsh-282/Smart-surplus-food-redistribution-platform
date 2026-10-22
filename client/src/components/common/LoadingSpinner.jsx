import Logo from './Logo';

const LoadingSpinner = ({ fullscreen = false, text = 'Loading...' }) => {
  if (fullscreen) {
    return (
      <div className="loading-screen">
        <Logo size={52} style={{ marginBottom: '1.25rem' }} />
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>{text}</p>
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
