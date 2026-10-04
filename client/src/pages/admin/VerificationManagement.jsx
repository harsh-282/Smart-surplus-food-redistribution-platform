import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import VerificationBadge from '../../components/common/VerificationBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ShieldIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BuildingIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-4-8h1m-1-4h1m4 4h1m-1-4h1M9 16h1m4 0h1" />
  </svg>
);

const UserIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SearchIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CheckIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BanIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const RefreshIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

const VerificationManagement = () => {
  const [activeTab, setActiveTab] = useState('ngo'); // 'ngo' | 'volunteer'
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    pendingNGOs: 0,
    pendingVolunteers: 0,
    verifiedNGOs: 0,
    verifiedVolunteers: 0,
    rejectedCount: 0,
    suspendedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState(null);

  // Rejection Reason Modal State
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchVerificationRequests = () => {
    setLoading(true);
    let url = `/admin/verification-requests?role=${activeTab}`;
    if (statusFilter !== 'All') {
      url += `&status=${statusFilter}`;
    }
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    api
      .get(url)
      .then((res) => {
        setRequests(res.data.requests || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      })
      .catch((err) => console.error('Error fetching verification requests:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerificationRequests();
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVerificationRequests();
  };

  const handleViewDetails = (userId) => {
    api
      .get(`/admin/verification-details/${userId}`)
      .then((res) => {
        setSelectedUser(res.data.user);
      })
      .catch((err) => {
        alert(err.response?.data?.message || 'Failed to fetch user verification details.');
      });
  };

  const handleUpdateStatus = async (userId, newStatus, reason = '') => {
    setActionLoading(userId);
    try {
      const res = await api.put(`/admin/verify-user/${userId}`, {
        status: newStatus,
        reason,
      });

      // Update local state
      setRequests((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verificationStatus: newStatus } : u))
      );

      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser((prev) => ({
          ...prev,
          verificationStatus: newStatus,
          verificationRejectionReason: reason || prev?.verificationRejectionReason,
        }));
      }

      setRejectingUser(null);
      setRejectionReason('');

      fetchVerificationRequests();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'All') return true;
    return (r.verificationStatus || 'Pending') === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#059669', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem' }}>NGO & Volunteer Verification</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Admin verification management for trust and food safety assurance</p>
          </div>
        </div>
        <button onClick={fetchVerificationRequests} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid-4" style={{ gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Pending NGOs</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#92400e', marginTop: '0.25rem' }}>{stats.pendingNGOs}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Pending Volunteers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#92400e', marginTop: '0.25rem' }}>{stats.pendingVolunteers}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Verified NGOs</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>{stats.verifiedNGOs}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981', background: '#ecfdf5' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Verified Volunteers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>{stats.verifiedVolunteers}</div>
        </div>
      </div>

      {/* Main Verification Panel */}
      <div className="card">
        {/* Controls Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle, #f3f4f6)', padding: '0.35rem', borderRadius: '0.75rem' }}>
              <button
                onClick={() => setActiveTab('ngo')}
                className={`btn btn-sm ${activeTab === 'ngo' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <BuildingIcon className="w-4 h-4" />
                <span>NGO Verification</span>
                {stats.pendingNGOs > 0 && (
                  <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                    {stats.pendingNGOs}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('volunteer')}
                className={`btn btn-sm ${activeTab === 'volunteer' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserIcon className="w-4 h-4" />
                <span>Volunteer Verification</span>
                {stats.pendingVolunteers > 0 && (
                  <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                    {stats.pendingVolunteers}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Verified', 'Rejected', 'Suspended'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder={`Search ${activeTab === 'ngo' ? 'NGO name, contact person' : 'volunteer name'}, email, phone...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
              />
              <SearchIcon className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>

        {/* Requests Table / Cards */}
        {loading ? (
          <LoadingSpinner message={`Loading ${activeTab === 'ngo' ? 'NGO' : 'Volunteer'} verification requests...`} />
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, margin: '0 0 0.25rem 0' }}>No {activeTab === 'ngo' ? 'NGO' : 'Volunteer'} requests found</h3>
            <p className="text-muted text-sm">There are no records matching your current search or status filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{activeTab === 'ngo' ? 'NGO / Organization' : 'Volunteer Name'}</th>
                  <th>Contact Details</th>
                  <th>{activeTab === 'ngo' ? 'Contact Person' : 'Availability'}</th>
                  <th>Registration Date</th>
                  <th>Verification Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const profile = req.ngoProfile || req.volunteerProfile || {};
                  const isNGO = req.role === 'ngo';
                  const currentStatus = req.verificationStatus || 'Pending';

                  return (
                    <tr key={req._id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {isNGO ? profile.organizationName || req.name : req.name}
                        </strong>
                        {profile.city && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            📍 {profile.city}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>📧 {req.email}</div>
                          <div className="text-muted">📞 {profile.phone || req.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td>
                        {isNGO ? (
                          <span style={{ fontSize: '0.85rem' }}>{profile.contactPerson || req.name}</span>
                        ) : (
                          <span className={`badge ${profile.availability === 'Available' ? 'badge-available' : 'badge-cancelled'}`}>
                            {profile.availability || 'Available'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(req.createdAt)}
                      </td>
                      <td>
                        <VerificationBadge status={currentStatus} role={req.role} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleViewDetails(req._id)}
                            className="btn btn-secondary btn-sm"
                            title="View Full Profile"
                          >
                            <EyeIcon className="w-4 h-4" /> View
                          </button>

                          {currentStatus !== 'Verified' && (
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'Verified')}
                              disabled={actionLoading === req._id}
                              className="btn btn-success btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <CheckIcon className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {currentStatus !== 'Rejected' && (
                            <button
                              onClick={() => {
                                setRejectingUser(req);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading === req._id}
                              className="btn btn-danger btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <CrossIcon className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}

                          {currentStatus === 'Verified' && (
                            <button
                              onClick={() => handleUpdateStatus(req._id, 'Suspended')}
                              disabled={actionLoading === req._id}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <BanIcon className="w-3.5 h-3.5" /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Review Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {selectedUser.role === 'ngo'
                    ? selectedUser.ngoProfile?.organizationName || selectedUser.name
                    : selectedUser.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <VerificationBadge status={selectedUser.verificationStatus} role={selectedUser.role} size="xs" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered: {formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f9fafb', padding: '1rem', borderRadius: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>EMAIL</div>
                  <strong style={{ wordBreak: 'break-all' }}>{selectedUser.email}</strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PHONE</div>
                  <strong>{selectedUser.ngoProfile?.phone || selectedUser.volunteerProfile?.phone || selectedUser.phone || 'N/A'}</strong>
                </div>
                {selectedUser.role === 'ngo' && (
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONTACT PERSON</div>
                    <strong>{selectedUser.ngoProfile?.contactPerson || selectedUser.name}</strong>
                  </div>
                )}
                {selectedUser.role === 'ngo' && (
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>REGISTRATION NUMBER</div>
                    <strong>{selectedUser.ngoProfile?.registrationNumber || 'N/A'}</strong>
                  </div>
                )}
                {selectedUser.role === 'volunteer' && (
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AVAILABILITY</div>
                    <strong>{selectedUser.volunteerProfile?.availability || 'Available'}</strong>
                  </div>
                )}
                {selectedUser.role === 'volunteer' && (
                  <div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>VEHICLE TYPE</div>
                    <strong>{selectedUser.volunteerProfile?.vehicleType || 'Motorcycle'}</strong>
                  </div>
                )}
              </div>

              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>ADDRESS & LOCATION</div>
                <div>{selectedUser.ngoProfile?.address || selectedUser.volunteerProfile?.address || selectedUser.address || 'Address not provided'}</div>
              </div>

              {selectedUser.role === 'ngo' && selectedUser.ngoProfile?.description && (
                <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>ORGANIZATION DESCRIPTION</div>
                  <div>{selectedUser.ngoProfile.description}</div>
                </div>
              )}

              {selectedUser.verificationStatus === 'Rejected' && selectedUser.verificationRejectionReason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '0.75rem', color: '#991b1b' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>REJECTION REASON</div>
                  <div style={{ marginTop: '0.25rem' }}>{selectedUser.verificationRejectionReason}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', pt: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary">Close</button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedUser.verificationStatus !== 'Verified' && (
                  <button onClick={() => handleUpdateStatus(selectedUser._id, 'Verified')} className="btn btn-success">
                    ✓ Approve Verification
                  </button>
                )}
                {selectedUser.verificationStatus !== 'Rejected' && (
                  <button onClick={() => { setRejectingUser(selectedUser); setRejectionReason(''); }} className="btn btn-danger">
                    ✕ Reject
                  </button>
                )}
                {selectedUser.verificationStatus === 'Verified' && (
                  <button onClick={() => handleUpdateStatus(selectedUser._id, 'Suspended')} className="btn btn-secondary">
                    🚫 Suspend Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 800, margin: '0 0 0.5rem 0', color: '#dc2626' }}>Reject Verification Request</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
              Please provide a clear reason why <strong>{rejectingUser.name}</strong> is not approved for verification:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Profile contact information is incomplete or organization registration number could not be validated."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="form-control"
              style={{ width: '100%', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setRejectingUser(null)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={() => handleUpdateStatus(rejectingUser._id, 'Rejected', rejectionReason)}
                className="btn btn-danger"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationManagement;
