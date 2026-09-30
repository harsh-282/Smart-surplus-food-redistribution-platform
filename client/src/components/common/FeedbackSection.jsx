import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import StarRating from './StarRating';
import { useAuth } from '../../context/AuthContext';

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const FeedbackSection = ({ donation }) => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFeedback = useCallback(async () => {
    if (!donation?._id) return;
    try {
      const res = await api.get(`/feedback/donation/${donation._id}`);
      setFeedbackList(res.data.feedbackList || []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [donation?._id]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (!donation) return null;

  // Determine eligible target users for current reviewer based on donation involvement
  const targetOptions = [];
  if (user && donation) {
    const isDonor = donation.donorId && (donation.donorId._id || donation.donorId) === user._id;
    const isNGO = donation.acceptedBy && (donation.acceptedBy._id || donation.acceptedBy) === user._id;
    const isVolunteer = donation.volunteerId && (donation.volunteerId._id || donation.volunteerId) === user._id;

    if (isDonor) {
      if (donation.acceptedBy) {
        targetOptions.push({
          id: donation.acceptedBy._id || donation.acceptedBy,
          name: donation.acceptedBy.name || 'NGO Partner',
          role: 'NGO',
        });
      }
    } else if (isNGO) {
      if (donation.donorId) {
        targetOptions.push({
          id: donation.donorId._id || donation.donorId,
          name: donation.donorId.name || 'Donor',
          role: 'Donor',
        });
      }
      if (donation.volunteerId) {
        targetOptions.push({
          id: donation.volunteerId._id || donation.volunteerId,
          name: donation.volunteerId.name || 'Volunteer',
          role: 'Volunteer',
        });
      }
    } else if (isVolunteer) {
      if (donation.donorId) {
        targetOptions.push({
          id: donation.donorId._id || donation.donorId,
          name: donation.donorId.name || 'Donor',
          role: 'Donor',
        });
      }
      if (donation.acceptedBy) {
        targetOptions.push({
          id: donation.acceptedBy._id || donation.acceptedBy,
          name: donation.acceptedBy.name || 'NGO Partner',
          role: 'NGO',
        });
      }
    }
  }

  // Auto-select first target option if not selected
  const activeTargetId = selectedTargetId || (targetOptions.length > 0 ? targetOptions[0].id : '');

  // Check if user already submitted feedback for the active target
  const userFeedbackForTarget = feedbackList.find(
    (f) =>
      f.reviewerId?._id === user?._id &&
      (!activeTargetId || f.targetUserId?._id === activeTargetId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (donation.status !== 'Completed') {
      setErrorMsg('Feedback and ratings are only allowed after a donation is officially Completed.');
      return;
    }

    if (!rating) {
      setErrorMsg('Please select a star rating (1 to 5 stars).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/feedback', {
        donationId: donation._id,
        targetUserId: activeTargetId || null,
        rating,
        comment,
      });

      setSuccessMsg('🎉 Feedback submitted successfully! Thank you for rating.');
      setComment('');
      fetchFeedback();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = donation.status === 'Completed';

  return (
    <div className="card feedback-section-card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
          ⭐ Ratings & Community Feedback
        </h3>
        {feedbackList.length > 0 && (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Total Reviews: <strong>{feedbackList.length}</strong>
          </span>
        )}
      </div>

      {/* 1. Status Restriction Warning (If donation is NOT Completed) */}
      {!isCompleted && (
        <div
          style={{
            background: 'var(--bg-card-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🔒</span>
          <div>
            <strong>Rating & Feedback Locked:</strong> Ratings can only be submitted once the food donation workflow is marked <strong>Completed</strong>. Current status: <em>{donation.status}</em>.
          </div>
        </div>
      )}

      {/* 2. Rating Submission Form (If Completed & user is involved) */}
      {isCompleted && targetOptions.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            Submit Your Feedback
          </h4>

          {userFeedbackForTarget ? (
            <div className="alert alert-success" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>✓ You have already reviewed this transaction</span>
                <StarRating value={userFeedbackForTarget.rating} readOnly={true} size="1rem" />
              </div>
              {userFeedbackForTarget.comment && (
                <p style={{ fontStyle: 'italic', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  "{userFeedbackForTarget.comment}"
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMsg && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}
              {successMsg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{successMsg}</div>}

              {/* Target User Selector if multiple options exist */}
              {targetOptions.length > 1 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Who are you rating?
                  </label>
                  <select
                    className="form-control"
                    value={activeTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                  >
                    {targetOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} ({opt.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star Rating Selector */}
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                  Rating Score:
                </label>
                <StarRating value={rating} onChange={setRating} size="1.5rem" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f59e0b' }}>
                  {rating} / 5 Stars
                </span>
              </div>

              {/* Written Review Textarea */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Written Review / Feedback (Optional):
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share details about food quality, punctuality, packaging, or overall experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '★ Submit Rating & Feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 3. Display Existing Feedback List */}
      {loading ? (
        <p className="text-muted text-sm">Loading reviews...</p>
      ) : feedbackList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No reviews or ratings have been posted for this donation yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {feedbackList.map((f) => (
            <div
              key={f._id}
              style={{
                padding: '0.875rem',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '8px',
                background: 'var(--bg-card, #ffffff)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{f.reviewerId?.name || 'Anonymous User'}</strong>
                  <span className="badge badge-secondary" style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                    {f.reviewerRole}
                  </span>
                  {f.targetUserId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ➔ rated <strong>{f.targetUserId.name}</strong> ({f.targetUserId.role})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StarRating value={f.rating} readOnly={true} size="0.9rem" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(f.createdAt)}
                  </span>
                </div>
              </div>
              {f.comment ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  "{f.comment}"
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No written comment provided.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
