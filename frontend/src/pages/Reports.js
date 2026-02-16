import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../utils/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cashier: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cashier) params.append('cashier', filters.cashier);

      const response = await axios.get(`${API_BASE_URL}/api/reports/sales?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setReports(response.data.invoices || []);
      setTotalSales(response.data.totalSales || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setTotalSales(0);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cashier) params.append('cashier', filters.cashier);

      const response = await axios.get(`${API_BASE_URL}/api/reports/sales/pdf?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${filters.startDate}-to-${filters.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF report');
    }
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({ ...filters, startDate: today, endDate: today });
  };

  const setThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

    setFilters({
      ...filters,
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0]
    });
  };

  const setThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFilters({
      ...filters,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

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
          Sales Reports
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.location.href = '/pos'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            🛒 Back to POS
          </button>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Filters */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E5E7EB',
          marginBottom: '24px'
        }}>
          <h2 style={{
            color: '#1F2937',
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Report Filters
          </h2>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label style={{
                display: 'block',
                color: '#1F2937',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1F2937',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#1F2937',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1F2937',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#1F2937',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Cashier
              </label>
              <input
                type="text"
                placeholder="Cashier name (optional)"
                value={filters.cashier}
                onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1F2937',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  minWidth: '150px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={setToday}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                Today
              </button>
              <button
                onClick={setThisWeek}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                This Week
              </button>
              <button
                onClick={setThisMonth}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                This Month
              </button>
            </div>

            <button
              onClick={exportPDF}
              disabled={reports.length === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: reports.length === 0 ? '#E5E7EB' : '#2D8CFF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: reports.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (reports.length > 0) e.target.style.backgroundColor = '#1A73E8';
              }}
              onMouseLeave={(e) => {
                if (reports.length > 0) e.target.style.backgroundColor = '#2D8CFF';
              }}
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#6B7280',
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              Total Sales
            </h3>
            <p style={{
              color: '#10B981',
              margin: '0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Rp {totalSales.toLocaleString('id-ID')}
            </p>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#6B7280',
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              Total Transactions
            </h3>
            <p style={{
              color: '#2D8CFF',
              margin: '0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              {reports.length}
            </p>
          </div>

          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#6B7280',
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              Average Transaction
            </h3>
            <p style={{
              color: '#F59E0B',
              margin: '0',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Rp {reports.length > 0 ? (totalSales / reports.length).toLocaleString('id-ID') : '0'}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
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
            Sales Details ({reports.length} transactions)
          </h2>

          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6B7280'
            }}>
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6B7280'
            }}>
              No sales data found for the selected period
            </div>
          ) : (
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '20px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Invoice #
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Date
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Cashier
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Items
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Total
                    </th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '14px'
                    }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr 
                      key={report.id || index} 
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background-color 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedInvoice(report);
                        setShowDetail(true);
                      }}
                      onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#EBF5FF'}
                      onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        fontWeight: '500',
                        color: '#1F2937'
                      }}>
                        #{report.id}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#6B7280'
                      }}>
                        {new Date(report.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#6B7280'
                      }}>
                        {report.cashier?.name || 'Unknown'}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        color: '#6B7280'
                      }}>
                        {report.items?.length || 0} items
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#10B981'
                      }}>
                        Rp {Number(report.total || 0).toLocaleString('id-ID')}
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          backgroundColor: report.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                          color: report.status === 'paid' ? '#065F46' : '#92400E'
                        }}>
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showDetail && selectedInvoice && (
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
            border: '1px solid #E5E7EB',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                color: '#1F2937',
                margin: '0',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Invoice #{selectedInvoice.id} Details
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '5px 0', color: '#6B7280' }}>
                <strong>Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleString('id-ID')}
              </p>
              <p style={{ margin: '5px 0', color: '#6B7280' }}>
                <strong>Cashier:</strong> {selectedInvoice.cashier?.name || 'Unknown'}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Status:</strong>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  backgroundColor: selectedInvoice.status === 'paid' ? '#10B981' : '#F59E0B',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginLeft: '8px',
                  textTransform: 'uppercase'
                }}>
                  {selectedInvoice.status}
                </span>
              </p>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              border: '1px solid #E5E7EB'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '14px'
                  }}>Product</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '14px'
                  }}>Qty</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '14px'
                  }}>Price</th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#1F2937',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '14px'
                  }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                      {item.name || item.product?.name || 'Product'}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      {item.quantity}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Rp {Number(item.price || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      Rp {Number(item.total || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: '#1F2937' }}>Total Amount:</span>
                <span style={{ color: '#10B981' }}>
                  Rp {Number(selectedInvoice.total || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6B7280',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4B5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6B7280'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;