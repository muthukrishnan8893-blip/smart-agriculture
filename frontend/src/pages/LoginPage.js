// pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './AuthPages.css';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const { lang } = useLanguage();
  const T = translations[lang]?.auth || translations.en.auth;
  const C = translations[lang]?.common || translations.en.common;
  const [role, setRole]       = useState('farmer');      // 'farmer' | 'admin'
  const [loginWith, setLoginWith] = useState('phone');   // 'phone' | 'email'
  const [form, setForm]       = useState({ identifier: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.identifier, form.password, loginWith);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">{role === 'admin' ? '⚙️' : '🌾'}</div>
        <h2>Smart Agriculture Platform</h2>
        <p className="auth-subtitle">
          {role === 'admin' ? 'Admin Login' : 'Farmer Login'}
        </p>

        {/* Role Toggle */}
        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn ${role === 'farmer' ? 'active' : ''}`}
            onClick={() => { setRole('farmer'); setError(''); }}
          >
            👨‍🌾 Farmer
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setLoginWith('email'); setError(''); }}
          >
            ⚙️ Admin
          </button>
        </div>

        {/* Login With Toggle (only for farmers) */}
        {role === 'farmer' && (
          <div className="login-with-toggle">
            <button
              type="button"
              className={`lw-btn ${loginWith === 'phone' ? 'active' : ''}`}
              onClick={() => { setLoginWith('phone'); setForm({ identifier: '', password: '' }); }}
            >
              📱 Phone
            </button>
            <button
              type="button"
              className={`lw-btn ${loginWith === 'email' ? 'active' : ''}`}
              onClick={() => { setLoginWith('email'); setForm({ identifier: '', password: '' }); }}
            >
              📧 Email
            </button>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              {loginWith === 'phone' && role === 'farmer' ? '📱 Phone Number' : '📧 Email Address'}
            </label>
            <input
              type={loginWith === 'phone' && role === 'farmer' ? 'tel' : 'email'}
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder={
                loginWith === 'phone' && role === 'farmer'
                  ? '9876543210'
                  : role === 'admin' ? 'admin@agri.com' : 'farmer@example.com'
              }
              required
            />
          </div>
          <div className="form-group">
            <label>🔒 Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? C.loading : `🔑 ${T.loginBtn}`}
          </button>
        </form>

        <p className="auth-switch">
          {T.noAccount} <Link to="/register">{T.register}</Link>
        </p>
      </div>
    </div>
  );
}
