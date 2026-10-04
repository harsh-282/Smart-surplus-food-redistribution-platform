import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRDonationCode = ({ donation, size = 180, showDownload = true }) => {
  const qrRef = useRef(null);

  if (!donation) return null;

  const qrId = donation.qrDonationId || donation._id;
  const qrValue = `${window.location.origin}/donations/qr/${qrId}`;

  const handleDownload = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `FoodShare-QR-${qrId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div
        ref={qrRef}
        style={{
          background: '#ffffff',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '2px solid var(--border-color, #e2e8f0)',
          display: 'inline-block',
        }}
      >
        <QRCodeSVG
          value={qrValue}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="badge badge-secondary" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
          {qrId}
        </div>
        <p className="text-muted text-sm" style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
          Scan with mobile camera or FoodShare app scanner
        </p>
      </div>

      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem', marginTop: '0.25rem' }}
        >
          ⬇️ Download QR Image
        </button>
      )}
    </div>
  );
};

export default QRDonationCode;
