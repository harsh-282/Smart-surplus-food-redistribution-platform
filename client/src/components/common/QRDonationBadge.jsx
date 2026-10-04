import { useState } from 'react';
import QRDonationModal from './QRDonationModal';

const QRDonationBadge = ({ donation }) => {
  const [showModal, setShowModal] = useState(false);

  if (!donation) return null;

  const qrId = donation.qrDonationId || donation._id;

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
          padding: '0.25rem 0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #e2e8f0)',
          fontSize: '0.8rem',
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>📷</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
          {qrId}
        </span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.1rem 0.4rem', fontSize: '0.725rem', marginLeft: '0.2rem' }}
          title="View & Download QR Code"
        >
          View QR
        </button>
      </div>

      <QRDonationModal
        donation={donation}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default QRDonationBadge;
