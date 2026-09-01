const STATUS_MAP = {
  'Available':        { cls: 'badge-available',  icon: '🟢', label: 'Available' },
  'Accepted':         { cls: 'badge-accepted',   icon: '✅', label: 'Accepted' },
  'Pickup Assigned':  { cls: 'badge-assigned',   icon: '🚴', label: 'Pickup Assigned' },
  'Picked Up':        { cls: 'badge-picked',     icon: '📦', label: 'Picked Up' },
  'Delivered':        { cls: 'badge-delivered',  icon: '🚚', label: 'Delivered' },
  'Completed':        { cls: 'badge-completed',  icon: '🎉', label: 'Completed' },
  'Cancelled':        { cls: 'badge-cancelled',  icon: '❌', label: 'Cancelled' },
};

const ROLE_MAP = {
  donor:     { cls: 'badge-donor',     icon: '🍽️',  label: 'Donor' },
  ngo:       { cls: 'badge-ngo',       icon: '🏢',  label: 'NGO' },
  volunteer: { cls: 'badge-volunteer', icon: '🚴',  label: 'Volunteer' },
  admin:     { cls: 'badge-admin',     icon: '👑',  label: 'Admin' },
};

const StatusBadge = ({ status, role }) => {
  if (role) {
    const r = ROLE_MAP[role] || { cls: '', icon: '', label: role };
    return <span className={`badge ${r.cls}`}>{r.icon} {r.label}</span>;
  }
  const s = STATUS_MAP[status] || { cls: '', icon: '⚪', label: status };
  return <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>;
};

export default StatusBadge;
