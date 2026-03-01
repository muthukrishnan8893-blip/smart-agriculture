// components/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',      icon: '🏠', key: 'dashboard' },
  { to: '/weather',        icon: '🌦️', key: 'weather' },
  { to: '/fertilizer',     icon: '🌱', key: 'fertilizer' },
  { to: '/market',         icon: '📈', key: 'market' },
  { to: '/disease',        icon: '🔬', key: 'disease' },
  { to: '/schemes',        icon: '📋', key: 'schemes' },
  { to: '/calendar',       icon: '📅', key: 'calendar' },
  { to: '/nearby-markets', icon: '🗺️', key: 'nearbyMarkets' },
  { to: '/sms-alerts',     icon: '📲', key: 'smsAlerts' },
  { to: '/price-compare',  icon: '⚖️', key: 'priceCompare' },
];

export default function Sidebar({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const { lang, switchLang, LANGUAGES: LANGS } = useLanguage();
  const navigate = useNavigate();
  const s = translations[lang]?.sidebar || translations.en.sidebar;
  const c = translations[lang]?.common  || translations.en.common;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span>🌾</span>
        <span>{s.appName}</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{s[item.key]}</span>
          </NavLink>
        ))}

        {/* Admin link only for admin users */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            <span>{s.admin}</span>
          </NavLink>
        )}
      </nav>

      {/* Footer user info */}
      <div className="sidebar-footer">
        {/* Language Switcher */}
        <div className="lang-switcher">
          <span className="lang-label">🌐 {s.language}</span>
          <div className="lang-options">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                className={`lang-btn ${lang === code ? 'active' : ''}`}
                onClick={() => switchLang(code)}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          className="dark-toggle"
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? c.lightMode : c.darkMode}
        >
          <span>{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? c.lightMode : c.darkMode}</span>
        </button>

        <div className="user-info" onClick={() => navigate('/profile')} style={{cursor:'pointer'}} title={c.edit}>
          <div className="name">{user?.full_name}</div>
          <div className="role">{user?.role} · ✏️ {c.edit}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span><span>{c.logout}</span>
        </button>
      </div>
    </aside>
  );
}

