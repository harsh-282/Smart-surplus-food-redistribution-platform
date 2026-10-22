import use3DTilt from '../../utils/use3DTilt';

/**
 * Reusable wrapper that enhances any child component with subtle 3D tilt.
 */
const TiltCard = ({
  children,
  className = '',
  style = {},
  maxTilt = 3.5,
  scale = 1.015,
  enabled = true,
  ...props
}) => {
  const tiltRef = use3DTilt({ maxTilt, scale, enabled });

  return (
    <div
      ref={tiltRef}
      className={`tilt-card-wrapper ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default TiltCard;
