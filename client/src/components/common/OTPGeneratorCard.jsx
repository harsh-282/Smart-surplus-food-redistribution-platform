import { useState, useEffect } from 'react';
import api from '../../services/api';

const OTPGeneratorCard = ({ donation, type = 'pickup', onOtpStatusChange }) => {
  const [otp, setOtp] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const isPickup = type === 'pickup';
  const isVerified = isPickup ? donation?.pickupOtpUsed : donation?.deliveryOtpUsed;
  const verifiedAt = isPickup ? donation?.pickupOtpVerifiedAt : donation?.deliveryOtpVerifiedAt;

  // Live Timer Effect
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Cooldown Timer Effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const cdInterval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(cdInterval);
  }, [cooldown]);

  const handleGenerateOtp = async () => {
    setGenerating(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = `/otp/${donation._id}/${type}/generate`;

    try {
      const res = await api.post(endpoint);
      if (res.data.success) {
        setOtp(res.data.otp);
        setExpiresAt(res.data.expiresAt);
        setTimeLeft(300); // 5 minutes
        setCooldown(30); // 30s cooldown
        setSuccessMsg(`🔐 New 6-Digit ${isPickup ? 'Pickup' : 'Delivery'} OTP generated! Share this verbally with the volunteer.`);
        if (onOtpStatusChange) onOtpStatusChange();
      }
    } catch (err) {
      console.error('OTP generate error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to generate OTP. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!donation) return null;

  return (
    <div
      className="card"
      style={{
        border: isVerified
          ? '2px solid var(--green-500, #22c55e)'
          : '2px solid var(--primary-glow, rgba(34, 197, 94, 0.3))',
        background: 'var(--bg-primary, #1e293b)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🔐 {isPickup ? 'Pickup Handover OTP' : 'Delivery Handover OTP'}
          </h3>
          <p className="text-muted text-sm" style={{ marginTop: '0.2rem', marginBottom: 0 }}>
            {isPickup
              ? 'Generate a secure 6-digit OTP to verify food handover to the assigned volunteer.'
              : 'Generate a secure 6-digit OTP to verify food receipt from the volunteer.'}
          </p>
        </div>
        <span className={`badge ${isVerified ? 'badge-success' : 'badge-primary'}`} style={{ fontWeight: 700 }}>
          {isVerified ? '✓ Handover Verified' : 'Handover Authentication'}
        </span>
      </div>

      {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}
      {errorMsg && <div className="alert alert-error mb-3">{errorMsg}</div>}

      {isVerified ? (
        <div className="alert alert-success" style={{ margin: 0 }}>
          🎉 <strong>{isPickup ? 'Pickup' : 'Delivery'} OTP Verified!</strong> Handover was successfully confirmed at{' '}
          {verifiedAt ? new Date(verifiedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'N/A'}.
        </div>
      ) : (
        <div>
          {/* Active OTP Display */}
          {otp && timeLeft > 0 ? (
            <div
              style={{
                background: 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                border: '1.5px dashed var(--orange-400, #f97316)',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                Share this 6-digit OTP verbally with the volunteer:
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  letterSpacing: '0.4em',
                  fontFamily: 'monospace',
                  color: 'var(--orange-400, #f97316)',
                  margin: '0.5rem 0',
                }}
              >
                {otp}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ⏱️ Valid for: <strong style={{ color: 'var(--text-primary)' }}>{formatTimer(timeLeft)}</strong>
              </div>
            </div>
          ) : otp && timeLeft === 0 ? (
            <div className="alert alert-warning mb-3">
              ⏰ This OTP has expired. Please click below to generate a new OTP.
            </div>
          ) : null}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGenerateOtp}
              className="btn btn-primary btn-block btn-lg"
              disabled={generating || cooldown > 0}
              style={{ fontWeight: 700 }}
            >
              {generating
                ? 'Generating OTP...'
                : cooldown > 0
                ? `Please wait ${cooldown}s`
                : otp
                ? '🔄 Regenerate New OTP'
                : `🔐 Generate ${isPickup ? 'Pickup' : 'Delivery'} OTP`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTPGeneratorCard;
