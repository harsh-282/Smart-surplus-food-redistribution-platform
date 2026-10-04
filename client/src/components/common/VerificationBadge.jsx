import React from 'react';

const CheckIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BanIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const VerificationBadge = ({ status = 'Pending', role = '', size = 'sm', className = '' }) => {
  const normStatus = (status || 'Pending').toLowerCase();
  const roleTitle = role ? (role.toLowerCase() === 'ngo' ? 'NGO' : 'Volunteer') : '';

  let config = {
    style: { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' },
    IconComponent: ClockIcon,
    label: `Pending ${roleTitle} Verification`,
  };

  if (normStatus === 'verified') {
    config = {
      style: { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' },
      IconComponent: CheckIcon,
      label: `✓ Verified ${roleTitle}`.trim(),
    };
  } else if (normStatus === 'rejected') {
    config = {
      style: { backgroundColor: '#ffe4e6', color: '#9f1239', borderColor: '#fecdd3' },
      IconComponent: AlertIcon,
      label: `Verification Rejected`,
    };
  } else if (normStatus === 'suspended') {
    config = {
      style: { backgroundColor: '#e5e7eb', color: '#1f2937', borderColor: '#d1d5db' },
      IconComponent: BanIcon,
      label: `Suspended Account`,
    };
  }

  const IconComp = config.IconComponent;

  const fontSizes = {
    xs: '0.7rem',
    sm: '0.75rem',
    md: '0.85rem',
    lg: '0.95rem',
  }[size] || '0.75rem';

  const paddings = {
    xs: '0.15rem 0.45rem',
    sm: '0.25rem 0.6rem',
    md: '0.35rem 0.75rem',
    lg: '0.5rem 1rem',
  }[size] || '0.25rem 0.6rem';

  return (
    <span
      className={`verification-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontWeight: 700,
        borderRadius: '9999px',
        border: '1px solid',
        fontSize: fontSizes,
        padding: paddings,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...config.style,
      }}
      title={`Verification Status: ${status}`}
    >
      <IconComp className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};

export default VerificationBadge;
