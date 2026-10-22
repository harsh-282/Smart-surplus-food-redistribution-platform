const Logo = ({
  size = 34,
  className = '',
  style = {},
  showText = false,
  textClassName = '',
  alt = 'FoodShare — Two People, One Shared Meal',
}) => {
  const imgElement = (
    <img
      src="/foodshare-logo.png"
      alt={alt}
      className={`foodshare-logo-img ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        background: 'transparent',
        flexShrink: 0,
        ...style,
      }}
    />
  );

  if (!showText) {
    return imgElement;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent' }}>
      {imgElement}
      <span className={textClassName || 'navbar-logo-text'}>
        Food<span style={{ color: 'var(--grass-primary, #55A630)' }}>Share</span>
      </span>
    </div>
  );
};

export default Logo;
