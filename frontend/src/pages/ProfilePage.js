// pages/ProfilePage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './ProfilePage.css';

const STATES = [
  'Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha',
  'Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh',
  'Uttarakhand','West Bengal'
];

const CROPS = [
  'Wheat','Rice','Maize','Cotton','Groundnut',
  'Tomato','Potato','Soybean','Onion','Sugarcane','Other'
];

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { lang } = useLanguage();
  const T = translations[lang]?.profile || translations.en.profile;

  const [tab, setTab] = useState('profile'); // 'profile' | 'password'

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone:     user?.phone     || '',
    state:     user?.state     || '',
    district:  user?.district  || '',
    crop_type: user?.crop_type || '',
  });

  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password:     '',
    confirm_password: '',
  });

  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const handleChange   = e => setForm({   ...form,   [e.target.name]: e.target.value });
  const handlePwChange = e => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const saveProfile = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      toast.success('Profile updated successfully!');
      // Refresh user in context by re-fetching
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async e => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match!');
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Avatar Card */}
      <div className="profile-hero card">
        <div className="profile-avatar">{user?.full_name?.[0]?.toUpperCase() || '👤'}</div>
        <div className="profile-hero-info">
          <div className="profile-name">{user?.full_name}</div>
          <div className="profile-role-badge">{user?.role === 'admin' ? '⚙️ Admin' : '👨‍🌾 Farmer'}</div>
          <div className="profile-meta">
            {user?.state && <span>📍 {user.state}</span>}
            {user?.crop_type && <span>🌾 {user.crop_type}</span>}
            {user?.phone && <span>📱 {user.phone}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          ✏️ {T.editTitle}
        </button>
        <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
          🔒 {T.changePassword}
        </button>
      </div>

      {/* Edit Profile Tab */}
      {tab === 'profile' && (
        <div className="card profile-form-card">
          <form onSubmit={saveProfile}>
            <div className="profile-grid">
              <div className="form-group">
                <label>{T.fullName}</label>
                <input name="full_name" value={form.full_name}
                  onChange={handleChange} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label>{T.phone}</label>
                <input name="phone" value={form.phone} type="tel"
                  onChange={handleChange} placeholder="10-digit phone number" />
              </div>
              <div className="form-group">
                <label>{T.state}</label>
                <select name="state" value={form.state} onChange={handleChange}>
                  <option value="">-- Select State --</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{T.district}</label>
                <input name="district" value={form.district}
                  onChange={handleChange} placeholder="Your district" />
              </div>
              <div className="form-group">
                <label>{T.cropType}</label>
                <select name="crop_type" value={form.crop_type} onChange={handleChange}>
                  <option value="">-- Select Crop --</option>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{T.email}</label>
                <input value={user?.email || ''} disabled className="input-disabled"
                  title="Email cannot be changed" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? T.saving : '💾 ' + T.saveChanges}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {tab === 'password' && (
        <div className="card profile-form-card">
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>{T.currentPassword}</label>
              <input type="password" name="current_password" value={pwForm.current_password}
                onChange={handlePwChange} placeholder="Enter current password" required />
            </div>
            <div className="form-group">
              <label>{T.newPassword}</label>
              <input type="password" name="new_password" value={pwForm.new_password}
                onChange={handlePwChange} placeholder="Min 6 characters" required />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" name="confirm_password" value={pwForm.confirm_password}
                onChange={handlePwChange} placeholder="Re-enter new password" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwSaving}>
              {pwSaving ? 'Changing...' : '🔑 Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
