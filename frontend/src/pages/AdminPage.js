// pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './AdminPage.css';

export default function AdminPage() {
  const [tab, setTab]         = useState('stats');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [priceForm, setPForm] = useState({ crop_name:'', market_name:'', state:'', district:'', price_per_quintal:'', date_recorded:'' });
  const [schemeForm, setSForm]= useState({ scheme_name:'', description:'', applicable_states:'All States', applicable_crops:'All', deadline:'', benefit:'', apply_link:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = () =>
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});

  const fetchUsers = () =>
    api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {});

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Delete failed'); }
  };

  const addPrice = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/prices', priceForm);
      toast.success('Price record added!');
      fetchStats();
      setPForm({ crop_name:'', market_name:'', state:'', district:'', price_per_quintal:'', date_recorded:'' });
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const addScheme = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/schemes', schemeForm);
      toast.success('Scheme added!');
      fetchStats();
      setSForm({ scheme_name:'', description:'', applicable_states:'All States', applicable_crops:'All', deadline:'', benefit:'', apply_link:'' });
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">⚙️ Admin Panel</h2>

      {/* Tabs */}
      <div className="admin-tabs">
        {['stats','users','prices','schemes'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'stats'   && '📊 Stats'}
            {t === 'users'   && '👥 Users'}
            {t === 'prices'  && '💰 Add Prices'}
            {t === 'schemes' && '📋 Add Scheme'}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="grid-3">
          <div className="stat-card card">
            <div className="stat-icon">👨‍🌾</div>
            <div className="stat-value">{stats.total_farmers}</div>
            <div className="stat-label">Registered Farmers</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">💹</div>
            <div className="stat-value">{stats.total_price_records}</div>
            <div className="stat-label">Price Records</div>
          </div>
          <div className="stat-card card">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{stats.total_schemes}</div>
            <div className="stat-label">Active Schemes</div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="card" style={{overflowX:'auto'}}>
          <h3 className="admin-section-title">Registered Farmers</h3>
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>State</th><th>Crop</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.filter(u => u.role === 'farmer').map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.state || '—'}</td>
                  <td>{u.crop_type || '—'}</td>
                  <td>{u.created_at?.slice(0,10)}</td>
                  <td>
                    <button className="btn-delete" onClick={() => deleteUser(u.id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Price Tab */}
      {tab === 'prices' && (
        <div className="card">
          <h3 className="admin-section-title">Add Market Price</h3>
          <form className="admin-form" onSubmit={addPrice}>
            <div className="grid-2">
              <div className="form-group">
                <label>Crop Name</label>
                <input required value={priceForm.crop_name}
                  onChange={e=>setPForm({...priceForm,crop_name:e.target.value})} placeholder="e.g. Wheat"/>
              </div>
              <div className="form-group">
                <label>Market Name</label>
                <input value={priceForm.market_name}
                  onChange={e=>setPForm({...priceForm,market_name:e.target.value})} placeholder="e.g. Azadpur Mandi"/>
              </div>
              <div className="form-group">
                <label>State</label>
                <input value={priceForm.state}
                  onChange={e=>setPForm({...priceForm,state:e.target.value})} placeholder="e.g. Delhi"/>
              </div>
              <div className="form-group">
                <label>District</label>
                <input value={priceForm.district}
                  onChange={e=>setPForm({...priceForm,district:e.target.value})} placeholder="e.g. Delhi"/>
              </div>
              <div className="form-group">
                <label>Price Per Quintal (₹)</label>
                <input required type="number" value={priceForm.price_per_quintal}
                  onChange={e=>setPForm({...priceForm,price_per_quintal:e.target.value})} placeholder="e.g. 2100"/>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input required type="date" value={priceForm.date_recorded}
                  onChange={e=>setPForm({...priceForm,date_recorded:e.target.value})}/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : '➕ Add Price'}
            </button>
          </form>
        </div>
      )}

      {/* Add Scheme Tab */}
      {tab === 'schemes' && (
        <div className="card">
          <h3 className="admin-section-title">Add Government Scheme</h3>
          <form className="admin-form" onSubmit={addScheme}>
            <div className="form-group">
              <label>Scheme Name</label>
              <input required value={schemeForm.scheme_name}
                onChange={e=>setSForm({...schemeForm,scheme_name:e.target.value})} placeholder="e.g. PM-KISAN"/>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={schemeForm.description}
                onChange={e=>setSForm({...schemeForm,description:e.target.value})} placeholder="Brief description..."/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Applicable States (comma-separated or 'All States')</label>
                <input value={schemeForm.applicable_states}
                  onChange={e=>setSForm({...schemeForm,applicable_states:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Applicable Crops (comma-separated or 'All')</label>
                <input value={schemeForm.applicable_crops}
                  onChange={e=>setSForm({...schemeForm,applicable_crops:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Benefit</label>
                <input value={schemeForm.benefit}
                  onChange={e=>setSForm({...schemeForm,benefit:e.target.value})} placeholder="e.g. Rs 6000/year"/>
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={schemeForm.deadline}
                  onChange={e=>setSForm({...schemeForm,deadline:e.target.value})}/>
              </div>
            </div>
            <div className="form-group">
              <label>Apply Link (URL)</label>
              <input type="url" value={schemeForm.apply_link}
                onChange={e=>setSForm({...schemeForm,apply_link:e.target.value})} placeholder="https://..."/>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : '➕ Add Scheme'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
