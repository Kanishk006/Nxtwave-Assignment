import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/admin/ImportPage';
import PendingPage from './pages/admin/PendingPage';
import ReportsPage from './pages/admin/ReportsPage';
import SubmissionsPage from './pages/hod/SubmissionsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/import"
            element={
              <ProtectedRoute requireAdmin>
                <ImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending"
            element={
              <ProtectedRoute requireAdmin>
                <PendingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* HOD Routes */}
          <Route
            path="/hod/submissions"
            element={
              <ProtectedRoute requireHOD>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
