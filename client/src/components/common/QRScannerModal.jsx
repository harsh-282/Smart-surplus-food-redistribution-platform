import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';

const QRScannerModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef(null);
  const scannerRegionId = 'qr-reader-region';

  // Current logged in user role
  const userStr = localStorage.getItem('foodshare_user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userRole = currentUser?.role || '';

  useEffect(() => {
    if (!isOpen) return;

    setScanError('');
    setCameraError('');
    let html5QrcodeScanner = null;

    const startCamera = async () => {
      try {
        setCameraActive(true);
        html5QrcodeScanner = new Html5Qrcode(scannerRegionId);
        scannerRef.current = html5QrcodeScanner;

        const config = { fps: 10, qrbox: { width: 220, height: 220 } };

        await html5QrcodeScanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleScannedCode(decodedText);
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().catch(console.error);
            }
          },
          () => {
            // Ignored frame scanning errors
          }
        );
      } catch (err) {
        console.warn('Camera start error:', err);
        setCameraActive(false);
        setCameraError(
          'Unable to access camera. Please allow camera permissions in your browser or type the QR Donation ID manually below.'
        );
      }
    };

    // Small delay to ensure modal DOM container is rendered
    const timer = setTimeout(startCamera, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(console.error);
        } else {
          try { scannerRef.current.clear(); } catch (_) {}
        }
      }
    };
  }, [isOpen]);

  const extractQrId = (text) => {
    if (!text) return '';
    const clean = text.trim();
    // If URL like https://foodshare.org/donations/qr/FS-DON-2026-123456
    if (clean.includes('/qr/')) {
      const parts = clean.split('/qr/');
      return parts[parts.length - 1].split('?')[0].split('#')[0];
    }
    if (clean.includes('/donations/')) {
      const parts = clean.split('/donations/');
      return parts[parts.length - 1].split('?')[0].split('#')[0];
    }
    return clean;
  };

  const handleScannedCode = async (rawCode) => {
    const qrId = extractQrId(rawCode);
    if (!qrId) return;

    setLoading(true);
    setScanError('');

    try {
      const res = await api.get(`/donations/qr/${qrId}`);

      if (res.data.success && res.data.donation) {
        const donation = res.data.donation;
        onClose();

        // Navigate based on user role
        if (userRole === 'ngo') {
          navigate(`/ngo/donations/${donation._id}`);
        } else if (userRole === 'volunteer') {
          navigate(`/volunteer/deliveries/${donation._id}`);
        } else if (userRole === 'admin') {
          navigate(`/admin/donations/${donation._id}`);
        } else {
          navigate(`/donor/donations/${donation._id}`);
        }
      }
    } catch (err) {
      console.error('QR validation error:', err);
      const msg = err.response?.data?.message || 'Failed to validate QR code. Please verify permissions or QR ID.';
      setScanError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScannedCode(manualInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
          maxWidth: '480px',
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📷 Scan FoodShare QR Code
            </h3>
            <p className="text-muted text-sm" style={{ margin: '0.2rem 0 0 0' }}>
              Align QR code inside camera scanner or enter QR ID manually
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {scanError && (
          <div className="alert alert-error mb-3" style={{ fontSize: '0.875rem' }}>
            ⚠️ {scanError}
          </div>
        )}

        {/* Camera Scanner Container */}
        <div
          id={scannerRegionId}
          style={{
            width: '100%',
            minHeight: '230px',
            background: '#000000',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1rem',
            position: 'relative',
          }}
        />

        {cameraError && (
          <div className="alert alert-warning mb-3" style={{ fontSize: '0.85rem' }}>
            💡 {cameraError}
          </div>
        )}

        {loading && (
          <div className="alert alert-info mb-3" style={{ fontSize: '0.875rem' }}>
            ⏳ Validating QR donation ID and checking user authorization...
          </div>
        )}

        {/* Manual QR ID Fallback Form */}
        <form onSubmit={handleManualSubmit} style={{ marginTop: '0.5rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>
            ⌨️ Manual QR Donation Reference Entry
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. FS-DON-2026-834912"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              disabled={loading}
              style={{ fontFamily: 'monospace' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !manualInput.trim()}
              style={{ whitespace: 'nowrap' }}
            >
              Verify & Open
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
