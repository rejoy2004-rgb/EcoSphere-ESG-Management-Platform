import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Environmental } from './pages/Environmental';
import { Social } from './pages/Social';
import { Governance } from './pages/Governance';
import { Gamification } from './pages/Gamification';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/environmental" element={<Environmental />} />
          <Route path="/social" element={<Social />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/reports" element={<Reports />} />
          {user?.role === 'ADMIN' && (
            <Route path="/settings" element={<Settings />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
