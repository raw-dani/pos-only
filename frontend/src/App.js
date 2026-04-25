import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import POS from './pages/POS';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import ErrorBoundary from './components/ErrorBoundary';
import { isAdmin, isManager, getUserRole } from './utils/auth';

// ProtectedRoute: redirect ke /pos jika tidak memiliki akses
const ProtectedRoute = ({ children, requireAdmin, requireManager }) => {
  const role = getUserRole();
  if (!role) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin()) return <Navigate to="/pos" replace />;
  if (requireManager && !isManager()) return <Navigate to="/pos" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={
            <ProtectedRoute requireAdmin>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requireAdmin>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
