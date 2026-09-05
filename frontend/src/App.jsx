import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetails from './pages/AssetDetails';
import Booking from './pages/Booking';
import Maintenance from './pages/Maintenance';
import TransferApprovals from './pages/TransferApprovals';
import Audits from './pages/Audits';
import ActivityLogs from './pages/ActivityLogs';
import OrgSetup from './pages/OrgSetup';
import Background from './components/Background';
import Navbar from './components/Navbar';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ padding: '24px 16px' }}>
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <div className="app-shell" style={{ padding: 0 }}>
      <Background />
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
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Assets />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AssetDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Booking />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Maintenance />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfers"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TransferApprovals />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audits"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Audits />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ActivityLogs />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-setup"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrgSetup />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
