import QRDonationCode from './QRDonationCode';

const QRDonationModal = ({ donation, isOpen, onClose }) => {
  if (!isOpen || !donation) return null;

  const handlePrint = () => {
    window.print();
  };

  const qrId = donation.qrDonationId || donation._id;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '450px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-primary, #1e293b)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📱 QR Donation Reference
          </h3>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Donation Details Summary */}
        <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {donation.foodName}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Category: <strong>{donation.category}</strong> | Quantity: <strong>{donation.quantity}</strong>
          </div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Status: <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>{donation.status}</span>
          </div>
        </div>

        {/* QR Code Renderer */}
        <QRDonationCode donation={donation} size={200} showDownload={true} />

        {/* Print / Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            🖨️ Print QR
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRDonationModal;
