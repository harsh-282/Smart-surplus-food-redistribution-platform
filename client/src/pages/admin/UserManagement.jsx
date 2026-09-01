import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionsLoading, setActionsLoading] = useState(null);

  const ROLES = ['All', 'donor', 'ngo', 'volunteer'];

  const fetchUsers = () => {
    setLoading(true);
    let url = '/admin/users';
    if (roleFilter !== 'All') {
      url += `?role=${roleFilter}`;
    }
    api.get(url)
      .then(res => setUsers(res.data.users))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (id) => {
    setActionsLoading(id);
    try {
      const res = await api.put(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: res.data.user.isActive } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionsLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    setActionsLoading(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionsLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage, activate/deactivate, or delete ecosystem users.</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: 160 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="donor">Donors</option>
          <option value="ngo">NGOs</option>
          <option value="volunteer">Volunteers</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No users found</div>
          <div className="empty-state-desc">Try changing your search query or filter.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><StatusBadge role={u.role} /></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-available' : 'badge-cancelled'}`}>
                      {u.isActive ? '🟢 Active' : '🔴 Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={actionsLoading === u._id}
                        style={{ minWidth: 90 }}
                      >
                        {actionsLoading === u._id ? 'Updating...' : u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="btn btn-danger btn-sm"
                        disabled={actionsLoading === u._id}
                      >
                        Delete
                      </button>
                    </div>
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

export default UserManagement;
