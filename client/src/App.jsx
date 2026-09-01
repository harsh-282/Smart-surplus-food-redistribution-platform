import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Donor Pages
import DonorDashboard from './pages/donor/DonorDashboard';
import AddDonation from './pages/donor/AddDonation';
import MyDonations from './pages/donor/MyDonations';
import DonationDetails from './pages/donor/DonationDetails';
import DonorProfile from './pages/donor/Profile';

// NGO Pages
import NGODashboard from './pages/ngo/NGODashboard';
import AvailableDonations from './pages/ngo/AvailableDonations';
import AcceptedDonations from './pages/ngo/AcceptedDonations';
import NGODonationDetails from './pages/ngo/NGODonationDetails';
import NGOProfile from './pages/ngo/NGOProfile';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import AssignedDeliveries from './pages/volunteer/AssignedDeliveries';
import DeliveryDetails from './pages/volunteer/DeliveryDetails';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DonationManagement from './pages/admin/DonationManagement';
import AdminDonationDetails from './pages/admin/AdminDonationDetails';

// Loading
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Register />} />
      </Route>

      {/* Donor Routes */}
      <Route path="/donor" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <DashboardLayout role="donor" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<DonorDashboard />} />
        <Route path="add-donation" element={<AddDonation />} />
        <Route path="my-donations" element={<MyDonations />} />
        <Route path="donations/:id" element={<DonationDetails />} />
        <Route path="profile" element={<DonorProfile />} />
      </Route>

      {/* NGO Routes */}
      <Route path="/ngo" element={
        <ProtectedRoute allowedRoles={['ngo']}>
          <DashboardLayout role="ngo" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<NGODashboard />} />
        <Route path="available" element={<AvailableDonations />} />
        <Route path="accepted" element={<AcceptedDonations />} />
        <Route path="donations/:id" element={<NGODonationDetails />} />
        <Route path="profile" element={<NGOProfile />} />
      </Route>

      {/* Volunteer Routes */}
      <Route path="/volunteer" element={
        <ProtectedRoute allowedRoles={['volunteer']}>
          <DashboardLayout role="volunteer" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<VolunteerDashboard />} />
        <Route path="deliveries" element={<AssignedDeliveries />} />
        <Route path="deliveries/:id" element={<DeliveryDetails />} />
        <Route path="profile" element={<VolunteerProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="donations" element={<DonationManagement />} />
        <Route path="donations/:id" element={<AdminDonationDetails />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
