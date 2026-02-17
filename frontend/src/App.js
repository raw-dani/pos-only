import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import POS from './pages/POS';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
