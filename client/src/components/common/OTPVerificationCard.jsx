import { useState } from 'react';
import api from '../../services/api';

const OTPVerificationCard = ({ donation, type = 'pickup', onVerified }) => {
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPickup = type === 'pickup';
  const isVerified = isPickup ? donation?.pickupOtpUsed : donation?.deliveryOtpUsed;
  const verifiedAt = isPickup ? donation?.pickupOtpVerifiedAt : donation?.deliveryOtpVerifiedAt;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit numeric OTP.');
      return;
    }

    setVerifying(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = `/otp/${donation._id}/${type}/verify`;

    try {
      const res = await api.post(endpoint, { otp: otpInput.trim() });
      if (res.data.success) {
        setSuccessMsg(res.data.message || `🎉 ${isPickup ? 'Pickup' : 'Delivery'} OTP verified successfully!`);
        setOtpInput('');
        if (onVerified) onVerified(res.data.donation);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!donation) return null;

  return (
    <div
      className="card"
      style={{
        border: isVerified
          ? '2px solid var(--green-500, #22c55e)'
          : '2px solid var(--orange-400, #f97316)',
        background: 'var(--bg-primary, #1e293b)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔑 {isPickup ? 'Enter Pickup Handover OTP' : 'Enter Delivery Handover OTP'}
          </h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
            {isPickup
              ? 'Ask the Donor for the 6-digit handover OTP shown on their screen.'
              : 'Ask the NGO Representative for the 6-digit handover OTP shown on their screen.'}
          </p>
        </div>
        <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
          {isVerified ? '✓ Handover Verified' : 'OTP Verification Required'}
        </span>
      </div>

      {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error mb-3">{errorMsg}</div>}

      {isVerified ? (
        <div className="alert alert-success" style={{ margin: 0 }}>
          🎉 <strong>{isPickup ? 'Pickup' : 'Delivery'} OTP Verified!</strong> Handover was confirmed at{' '}
          {verifiedAt ? new Date(verifiedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'N/A'}.
        </div>
      ) : (
        <form onSubmit={handleVerify}>
          <div className="form-group mb-3">
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
              🔢 Enter 6-Digit {isPickup ? 'Pickup' : 'Delivery'} OTP:
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="form-control"
              placeholder="e.g. 482731"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              disabled={verifying}
              style={{
                fontSize: '1.5rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontWeight: 700,
                maxWidth: '300px',
                margin: '0 auto',
                display: 'block',
              }}
            />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={verifying || otpInput.trim().length !== 6}
              style={{ fontWeight: 700 }}
            >
              {verifying ? 'Verifying OTP...' : `✅ Verify ${isPickup ? 'Pickup' : 'Delivery'} OTP & Update Status`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OTPVerificationCard;
