// pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './AuthPages.css';

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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const T = translations[lang]?.auth || translations.en.auth;
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    state: '', district: '', crop_type: ''
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">🌾</div>
        <h2>Smart Agriculture Platform</h2>
        <p className="auth-subtitle">{T.registerSubtitle}</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>{T.fullName}</label>
              <input name="full_name" value={form.full_name}
                onChange={handleChange} placeholder="Ramesh Kumar" required />
            </div>
            <div className="form-group">
              <label>{T.phone}</label>
              <input name="phone" value={form.phone}
                onChange={handleChange} placeholder="9876543210" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="farmer@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="Min 6 characters" required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>State</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>District</label>
              <input name="district" value={form.district}
                onChange={handleChange} placeholder="Your district" />
            </div>
          </div>
          <div className="form-group">
            <label>Primary Crop</label>
            <select name="crop_type" value={form.crop_type} onChange={handleChange}>
              <option value="">Select Crop</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Registering...' : '✅ Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
