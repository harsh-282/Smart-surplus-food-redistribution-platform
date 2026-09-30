import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

const LiveTrackerControls = ({ donationId, donationStatus, isVolunteer = false, onTrackingChange }) => {
  const [trackingActive, setTrackingActive] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const intervalRef = useRef(null);

  // Fetch current tracking status from backend
  const fetchTrackingStatus = useCallback(async () => {
    if (!donationId) return;
    try {
      const res = await api.get(`/tracking/${donationId}`);
      if (res.data.success) {
        setTrackingActive(Boolean(res.data.trackingActive));
        setIsStale(Boolean(res.data.isStale));
        setLastUpdatedAt(res.data.lastUpdatedAt || null);
        if (res.data.location) {
          setVolunteerLocation(res.data.location);
        }
        if (onTrackingChange) {
          onTrackingChange(res.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch tracking status:', err);
    } finally {
      setLoading(false);
    }
  }, [donationId, onTrackingChange]);

  // Periodic polling for status updates (every 15s)
  useEffect(() => {
    fetchTrackingStatus();
    const pollTimer = setInterval(fetchTrackingStatus, 15000);
    return () => clearInterval(pollTimer);
  }, [fetchTrackingStatus]);

  // Send single GPS update to backend
  const sendLocationUpdate = useCallback(async (lat, lng, isStart = false) => {
    try {
      const endpoint = isStart ? '/tracking/start' : '/tracking/update';
      const method = isStart ? api.post : api.put;
      const res = await method(endpoint, { donationId, lat, lng });

      if (res.data.success) {
        setTrackingActive(true);
        setIsStale(false);
        setLastUpdatedAt(new Date());
        setVolunteerLocation({ lat, lng });
        setPermissionError('');
        if (onTrackingChange) {
          onTrackingChange({
            trackingActive: true,
            isStale: false,
            lastUpdatedAt: new Date(),
            location: { lat, lng },
          });
        }
      }
    } catch (err) {
      console.error('Location update failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to sync GPS location.');
    }
  }, [donationId, onTrackingChange]);

  // Obtain device GPS and trigger update
  const getDeviceLocation = useCallback((isStart = false) => {
    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your device browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        sendLocationUpdate(lat, lng, isStart);
      },
      (error) => {
        let msg = 'Failed to obtain GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied by user. Live tracking cannot run without GPS permission.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS signal unavailable. Please ensure location services are enabled on your device.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'GPS request timed out. Retrying on next cycle...';
        }
        setPermissionError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [sendLocationUpdate]);

  // Active tracking GPS interval loop for assigned volunteer (every 15s)
  useEffect(() => {
    if (isVolunteer && trackingActive && ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(donationStatus)) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          getDeviceLocation(false);
        }, 15000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVolunteer, trackingActive, donationStatus, getDeviceLocation]);

  // Auto-stop tracking when delivery completed or cancelled
  useEffect(() => {
    if (['Completed', 'Cancelled'].includes(donationStatus) && trackingActive) {
      api.put('/tracking/stop', { donationId }).catch(() => {});
      setTrackingActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [donationStatus, trackingActive, donationId]);

  const handleStartTracking = () => {
    if (!window.confirm('FoodShare requests permission to access your device GPS to share live delivery progress with the NGO and donor. Start live tracking?')) {
      return;
    }
    setErrorMsg('');
    setPermissionError('');
    getDeviceLocation(true);
  };

  const handleStopTracking = async () => {
    try {
      await api.put('/tracking/stop', { donationId });
      setTrackingActive(false);
      setIsStale(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onTrackingChange) {
        onTrackingChange({ trackingActive: false, isStale: true, location: volunteerLocation });
      }
    } catch (err) {
      setErrorMsg('Failed to stop tracking.');
    }
  };

  if (loading) return null;

  return (
    <div style={{ margin: '1rem 0' }}>
      {permissionError && (
        <div className="alert alert-warning mb-2" style={{ fontSize: '0.85rem' }}>
          ⚠️ {permissionError}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error mb-2" style={{ fontSize: '0.85rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {isVolunteer && ['Pickup Assigned', 'Picked Up', 'Delivered'].includes(donationStatus) && (
        <div className="card" style={{ padding: '1rem', background: trackingActive ? 'rgba(22, 163, 74, 0.04)' : 'var(--bg-card, #ffffff)', border: `1.5px solid ${trackingActive ? '#16a34a' : 'var(--border-color, #cbd5e1)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🚴 Live GPS Delivery Tracking
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                {trackingActive
                  ? 'Periodic GPS location updates are active (every 15s).'
                  : 'Start live GPS updates so NGO and Donor can monitor delivery progress.'}
              </p>
            </div>

            <div>
              {!trackingActive ? (
                <button onClick={handleStartTracking} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  🟢 Start Delivery Tracking
                </button>
              ) : (
                <button onClick={handleStopTracking} className="btn btn-danger btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  🔴 Stop Delivery Tracking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackerControls;
