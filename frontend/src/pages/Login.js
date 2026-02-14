import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../utils/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('DEBUG LOGIN - Attempting login with:', username);
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      console.log('DEBUG LOGIN - Response received:', res.data);
      localStorage.setItem('token', res.data.token);
      navigate('/pos');
    } catch (err) {
      console.error('DEBUG LOGIN - Error:', err);
      console.error('DEBUG LOGIN - Error response:', err.response);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F9FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            color: '#2D8CFF',
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            POS Invoice
          </h1>
          <p style={{
            color: '#6B7280',
            margin: '0',
            fontSize: '14px'
          }}>
            Login to access the system
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#1F2937',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Username
          </label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2D8CFF'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{
            display: 'block',
            color: '#1F2937',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px'
          }}>
            Password
          </label>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your password"
            type="password"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px',
              color: '#1F2937',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2D8CFF'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: loading ? '#A7D3FF' : '#2D8CFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1A73E8')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#2D8CFF')}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#A7D3FF',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#1A73E8',
            margin: '0',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Default: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;