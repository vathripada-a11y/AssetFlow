import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
import Assets from './pages/Assets';
import AssetDetails from './pages/AssetDetails';

export default function App() {
  return (
    <div className="app-shell">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:id"
              element={
                <ProtectedRoute>
                  <AssetDetails />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
=======
import OrgSetup from './pages/OrgSetup';
import Assets from './pages/Assets';
import Booking from './pages/Booking';
import Maintenance from './pages/Maintenance';

function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <nav style={{ display: 'flex', gap: 16, padding: 12, background: '#222', fontFamily: 'sans-serif' }}>
      <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>
      {user.role === 'admin' && <Link to="/org-setup" style={{ color: '#fff' }}>Org Setup</Link>}
      <Link to="/assets" style={{ color: '#fff' }}>Assets</Link>
      <Link to="/booking" style={{ color: '#fff' }}>Booking</Link>
      <Link to="/maintenance" style={{ color: '#fff' }}>Maintenance</Link>
      <span style={{ marginLeft: 'auto', color: '#fff' }}>{user.name} ({user.role})</span>
      <button onClick={logout}>Log out</button>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/org-setup" element={<ProtectedRoute><OrgSetup /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
>>>>>>> af7954805b81b11320d15f36809d1b7c08b89d76
  );
}