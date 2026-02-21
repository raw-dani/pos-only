import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/api';
import { isAdmin } from '../utils/auth';
import Footer from '../components/Footer';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    roleId: ''
  });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/api/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessage('User updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessage('User created successfully!');
      }
      fetchUsers();
      closeModal();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        name: user.name || '',
        email: user.email || '',
        roleId: user.roleId
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        roleId: roles.length > 0 ? roles[0].id : ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      roleId: ''
    });
    setError(null);
  };

  const openResetModal = (user) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetPasswordUser(null);
    setNewPassword('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Password is required');
      return;
    }
    setResetLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${resetPasswordUser.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage('Password reset successfully!');
      closeResetModal();
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'Manager':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'Cashier':
        return { bg: '#D1FAE5', color: '#065F46' };
      default:
        return { bg: '#E5E7EB', color: '#374151' };
    }
  };

  if (!isAdmin()) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F9FF',
        fontFamily: 'Arial, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#EF4444' }}>Access Denied</h2>
          <p style={{ color: '#6B7280' }}>You do not have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2D8CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F9FF',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          color: '#2D8CFF',
          margin: '0',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          👥 User Management
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2D8CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ← Back to POS
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Messages */}
        {message && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #10B981'
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #EF4444'
          }}>
            {error}
          </div>
        )}

        {/* Add User Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => openModal()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            ➕ Add New User
          </button>
        </div>

        {/* Users Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB'
        }}>
          <h2 style={{
            color: '#1F2937',
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Users ({users.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              Loading users...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Username</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const roleName = user.role?.name || 'Unknown';
                    const badgeStyle = getRoleBadgeColor(roleName);
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 16px', color: '#1F2937', fontWeight: '500' }}>{user.username}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280' }}>{user.name || '-'}</td>
                        <td style={{ padding: '12px 16px', color: '#6B7280' }}>{user.email || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.color
                          }}>
                            {roleName}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: user.isActive ? '#D1FAE5' : '#FEE2E2',
                            color: user.isActive ? '#065F46' : '#991B1B'
                          }}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => openModal(user)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2D8CFF',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openResetModal(user)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#F59E0B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#EF4444',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#1F2937', margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
              {editingUser ? '✏️ Edit User' : '➕ Add New User'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={editingUser}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: editingUser ? '#F3F4F6' : '#FFFFFF'
                  }}
                  placeholder="Enter username"
                />
              </div>

              {!editingUser && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter full name"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter email"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  Role *
                </label>
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6B7280',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#A7D3FF' : '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h2 style={{ color: '#1F2937', margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
              🔑 Reset Password
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '20px' }}>
              Reset password for user: <strong>{resetPasswordUser?.username}</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontWeight: '500' }}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter new password"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeResetModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6B7280',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: resetLoading ? '#A7D3FF' : '#F59E0B',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: resetLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Users;
