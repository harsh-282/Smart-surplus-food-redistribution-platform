import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

const QRRedirect = () => {
  const { qrDonationId } = useParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const userStr = localStorage.getItem('foodshare_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || '';

  useEffect(() => {
    if (!qrDonationId) {
      navigate('/');
      return;
    }

    api.get(`/donations/qr/${qrDonationId}`)
      .then((res) => {
        if (res.data.success && res.data.donation) {
          const donation = res.data.donation;
          if (role === 'ngo') {
            navigate(`/ngo/donations/${donation._id}`, { replace: true });
          } else if (role === 'volunteer') {
            navigate(`/volunteer/deliveries/${donation._id}`, { replace: true });
          } else if (role === 'admin') {
            navigate(`/admin/donations/${donation._id}`, { replace: true });
          } else {
            navigate(`/donor/donations/${donation._id}`, { replace: true });
          }
        }
      })
      .catch((err) => {
        console.error('QR redirect error:', err);
        setErrorMsg(err.response?.data?.message || 'Failed to open QR donation record. Access denied or invalid QR ID.');
      });
  }, [qrDonationId, role, navigate]);

  if (errorMsg) {
    return (
      <div className="container py-5 text-center">
        <div className="empty-state" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="empty-state-icon">🚫</div>
          <h2 className="empty-state-title">Access Denied / Invalid QR</h2>
          <p className="text-muted mb-3">{errorMsg}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner fullscreen text="Verifying QR donation reference..." />;
};

export default QRRedirect;
