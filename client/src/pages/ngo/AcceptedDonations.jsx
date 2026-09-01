import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const AcceptedDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ngo/donations')
      .then(res => setDonations(res.data.donations))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Accepted Donations</h1>
        <p className="page-subtitle">Track and coordinate pickups for food donations accepted by your organization.</p>
      </div>

      {donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No accepted donations yet</div>
          <div className="empty-state-desc">Accept available donations from the marketplace to distribute food.</div>
          <Link to="/ngo/available" className="btn btn-primary mt-2">View Available Donations</Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Food Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Donor</th>
                <th>Pickup Address</th>
                <th>Volunteer Assigned</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d._id}>
                  <td><strong>{d.foodName}</strong></td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{d.donorId?.name}</td>
                  <td>{d.pickupAddress?.slice(0, 30)}{d.pickupAddress?.length > 30 ? '...' : ''}</td>
                  <td>
                    {d.volunteerId ? (
                      <strong>{d.volunteerId.name}</strong>
                    ) : (
                      <span className="text-orange" style={{ fontSize: '0.85rem' }}>⚠️ Needs Volunteer</span>
                    )}
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <Link to={`/ngo/donations/${d._id}`} className="btn btn-secondary btn-sm">Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcceptedDonations;
