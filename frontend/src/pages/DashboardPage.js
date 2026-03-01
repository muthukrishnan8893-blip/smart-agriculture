// pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import api from '../utils/api';
import './DashboardPage.css';

const MODULES = [
  { to: '/weather',    icon: '🌦️', title: 'Weather Forecast',       desc: '7-day weather + rain prediction' },
  { to: '/fertilizer', icon: '🌱', title: 'Fertilizer Advisor',      desc: 'NPK & fertilizer recommendations' },
  { to: '/market',     icon: '📈', title: 'Market Prices',            desc: 'Crop prices + ML prediction' },
  { to: '/disease',    icon: '🔬', title: 'Disease Detection',        desc: 'AI-powered leaf analysis' },
  { to: '/schemes',    icon: '📋', title: 'Government Schemes',       desc: 'Subsidies & welfare schemes' },
];

const SEASON_TIPS = {
  winter:  ['🌾 Rabi season — ideal for wheat, mustard & chickpea.', '❄️ Watch for frost damage on young seedlings.', '💧 Reduce irrigation frequency; mornings are better.'],
  summer:  ['☀️ Kharif prep season — start field preparation now.', '🌡️ High heat — mulch crops to retain soil moisture.', '🐛 Pests are active; inspect leaves every 3 days.'],
  monsoon: ['🌧️ Kharif season — paddy, maize & soybean thrive now.', '⚠️ Excess water can cause root rot — ensure drainage.', '🍄 Fungal diseases peak in humidity — spray preventively.'],
};

function getSeason() {
  const m = new Date().getMonth(); // 0-11
  if (m >= 10 || m <= 1) return 'winter';
  if (m >= 2  && m <= 5) return 'summer';
  return 'monsoon';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const T = translations[lang]?.dashboard || translations.en.dashboard;
  const [weather, setWeather]   = useState(null);
  const [wLoading, setWLoading] = useState(true);
  const [schemes, setSchemes]   = useState([]);
  const [history, setHistory]   = useState([]);

  useEffect(() => {
    if (user?.state) {
      api.get(`/weather/current?city=${user.state}`)
        .then(res => setWeather(res.data.weather))
        .catch(() => setWeather(null))
        .finally(() => setWLoading(false));
    } else {
      setWLoading(false);
    }
    api.get('/schemes/').then(r => setSchemes(r.data.schemes || [])).catch(() => {});
    api.get('/disease/history').then(r => setHistory(r.data.detections || [])).catch(() => {});
  }, [user]);

  const season  = getSeason();
  const tips    = SEASON_TIPS[season];

  // weather-based alert
  const weatherAlerts = [];
  if (weather) {
    if (weather.temperature > 38) weatherAlerts.push({ type: 'warning', msg: `🌡️ Heat Alert: ${Math.round(weather.temperature)}°C — protect crops with mulching.` });
    if (weather.humidity > 85)    weatherAlerts.push({ type: 'warning', msg: `💦 High Humidity: ${weather.humidity}% — risk of fungal disease. Spray preventively.` });
    if (weather.wind_speed > 10)  weatherAlerts.push({ type: 'info',    msg: `💨 Strong winds (${weather.wind_speed} m/s) — avoid spraying pesticides today.` });
    if (weather.rain_1h > 0)      weatherAlerts.push({ type: 'info',    msg: `🌧️ Rain detected — delay fertilizer application for 24 hours.` });
  }

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div>
          <h1>{T.welcome}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p>{T.subtitle}</p>
        </div>
        <div className="banner-meta">
          {user?.state && <span>📍 {user.district || ''} {user.state}</span>}
          {user?.crop_type && <span>🌾 {user.crop_type}</span>}
        </div>
      </div>

      {/* Smart Alerts */}
      <section className="dashboard-section">
        <h3 className="section-title">{T.alerts}</h3>
        <div className="alerts-grid">
          {/* Season tips */}
          {tips.map((tip, i) => (
            <div key={i} className="alert-card alert-green">
              <span className="alert-icon">🌿</span>
              <span>{tip}</span>
            </div>
          ))}
          {/* Weather alerts */}
          {weatherAlerts.map((a, i) => (
            <div key={`w${i}`} className={`alert-card ${a.type === 'warning' ? 'alert-orange' : 'alert-blue'}`}>
              <span className="alert-icon">⚡</span>
              <span>{a.msg}</span>
            </div>
          ))}
          {/* Schemes count badge */}
          {schemes.length > 0 && (
            <div className="alert-card alert-purple">
              <span className="alert-icon">📋</span>
              <span>
                <strong>{schemes.length} Active Government Schemes</strong> available for farmers.{' '}
                <Link to="/schemes" style={{color:'inherit', textDecoration:'underline'}}>Explore →</Link>
              </span>
            </div>
          )}
          {/* Disease history nudge */}
          {history.length === 0 && (
            <div className="alert-card alert-blue">
              <span className="alert-icon">🔬</span>
              <span>No disease scans yet — <Link to="/disease" style={{color:'inherit',textDecoration:'underline'}}>scan a leaf</Link> to keep your crops healthy.</span>
            </div>
          )}
          {history.length > 0 && !history[0].disease_name?.includes('Healthy') && (
            <div className="alert-card alert-orange">
              <span className="alert-icon">⚠️</span>
              <span>Last scan detected <strong>{history[0].disease_name?.replace(/_/g,' ')}</strong>. <Link to="/disease" style={{color:'inherit',textDecoration:'underline'}}>View history →</Link></span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Row */}
      <section className="dashboard-section">
        <div className="stats-row">
          <div className="stat-chip">
            <span className="stat-num">{schemes.length}</span>
            <span className="stat-label">Schemes</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">{history.length}</span>
            <span className="stat-label">Disease Scans</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num">{weather ? `${Math.round(weather.temperature)}°C` : '--'}</span>
            <span className="stat-label">Temperature</span>
          </div>
          <div className="stat-chip">
            <span className="stat-num capitalize">{season}</span>
            <span className="stat-label">Season</span>
          </div>
        </div>
      </section>

      {/* Quick Weather Summary */}
      <section className="dashboard-section">
        <h3 className="section-title">📍 Local Weather</h3>
        {wLoading ? (
          <div className="spinner" />
        ) : weather ? (
          <div className="weather-summary card">
            <div className="ws-city">{weather.city}, {weather.country}</div>
            <div className="ws-row">
              <span className="ws-temp">{Math.round(weather.temperature)}°C</span>
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
              />
            </div>
            <div className="ws-desc">{weather.description}</div>
            <div className="ws-stats">
              <span>💧 {weather.humidity}% Humidity</span>
              <span>💨 {weather.wind_speed} m/s Wind</span>
              <span>🌧️ {weather.rain_1h} mm Rain</span>
            </div>
            <Link to="/weather" className="btn btn-outline" style={{marginTop:'0.8rem',fontSize:'0.85rem'}}>
              View 7-Day Forecast →
            </Link>
          </div>
        ) : (
          <div className="card" style={{color:'var(--text-muted)'}}>
            Weather not available. Update your state in profile.
          </div>
        )}
      </section>

      {/* Module Quick Access */}
      <section className="dashboard-section">
        <h3 className="section-title">{T.quickAccess}</h3>
        <div className="module-grid">
          {MODULES.map(m => (
            <Link key={m.to} to={m.to} className="module-card card">
              <div className="module-icon">{m.icon}</div>
              <div className="module-title">{m.title}</div>
              <div className="module-desc">{m.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
