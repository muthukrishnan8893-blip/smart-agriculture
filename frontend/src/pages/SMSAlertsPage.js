// pages/SMSAlertsPage.js - SMS Notification Alert System
import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './SMSAlertsPage.css';

const ALERT_ICONS = {
  weather: '⛈️', price: '📈', disease: '🦠',
  scheme: '📋', water: '💧', harvest: '🌾',
};

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

const CROP_TYPES = [
  'Rice','Wheat','Maize','Cotton','Sugarcane','Soybean','Groundnut',
  'Tomato','Onion','Potato','Tea','Coffee','Banana','Mango','Coconut',
  'Chili','Turmeric','Mustard','Jowar','Bajra',
];

export default function SMSAlertsPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.sms || translations.en.sms;

  const [phone, setPhone] = useState('');
  const [alertTypes, setAlertTypes] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [cropFilter, setCropFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ── Load data on mount ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, prefsRes, historyRes, statsRes] = await Promise.all([
        api.get('/sms/alert-types'),
        api.get('/sms/preferences'),
        api.get('/sms/history'),
        api.get('/sms/stats'),
      ]);
      setAlertTypes(typesRes.data.alert_types || {});
      const prefs = prefsRes.data.preferences || [];
      setActiveAlerts(prefs.filter(p => p.is_active).map(p => p.alert_type));
      if (prefs.length > 0) {
        setPhone(prefs[0].phone || '');
        setCropFilter(prefs[0].crop_filter || '');
        setStateFilter(prefs[0].state_filter || '');
      }
      setHistory(historyRes.data.history || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to load SMS data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toggle alert type ──────────────────────────────────────
  const toggleAlert = (type) => {
    setActiveAlerts(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // ── Save preferences ──────────────────────────────────────
  const savePreferences = async () => {
    if (!phone.trim()) {
      setMessage({ type: 'error', text: T.phoneRequired });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/sms/preferences', {
        phone: phone.trim(),
        alert_types: activeAlerts,
        crop_filter: cropFilter,
        state_filter: stateFilter,
      });
      setMessage({ type: 'success', text: res.data.message });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || T.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  // ── Send test SMS ──────────────────────────────────────────
  const sendTest = async () => {
    if (!phone.trim()) {
      setMessage({ type: 'error', text: T.phoneRequired });
      return;
    }
    setTestSending(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/sms/send-test', { phone: phone.trim() });
      const status = res.data.result?.status;
      if (status === 'delivered') {
        setMessage({ type: 'success', text: T.testSuccess });
      } else {
        setMessage({ type: 'error', text: T.testFailed });
      }
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || T.testFailed });
    } finally {
      setTestSending(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="sms-page"><div className="spinner" /></div>;

  return (
    <div className="sms-page">
      {/* ── Title ──────────────────────────────────────────── */}
      <h2>{T.title}</h2>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="sms-stats">
        <div className="sms-stat-card">
          <div className="sms-stat-icon">📱</div>
          <div className="sms-stat-value">{stats.active_alerts || 0}</div>
          <div className="sms-stat-label">{T.activeAlerts}</div>
        </div>
        <div className="sms-stat-card">
          <div className="sms-stat-icon">✅</div>
          <div className="sms-stat-value">{stats.delivered || 0}</div>
          <div className="sms-stat-label">{T.delivered}</div>
        </div>
        <div className="sms-stat-card">
          <div className="sms-stat-icon">📊</div>
          <div className="sms-stat-value">{stats.total_sent || 0}</div>
          <div className="sms-stat-label">{T.totalSent}</div>
        </div>
        <div className="sms-stat-card">
          <div className="sms-stat-icon">📅</div>
          <div className="sms-stat-value">{stats.recent_7_days || 0}</div>
          <div className="sms-stat-label">{T.last7Days}</div>
        </div>
      </div>

      {/* ── Phone Number ───────────────────────────────────── */}
      <div className="sms-phone-section">
        <h3>📞 {T.phoneSetup}</h3>
        <div className="sms-phone-row">
          <input
            type="tel"
            placeholder={T.phonePlaceholder}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={15}
          />
          <button
            className="sms-btn sms-btn-secondary"
            onClick={sendTest}
            disabled={testSending || !phone.trim()}
          >
            {testSending ? '⏳ ...' : `🔔 ${T.sendTest}`}
          </button>
        </div>
      </div>

      {/* ── Status Message ─────────────────────────────────── */}
      {message.text && (
        <div className={message.type === 'success' ? 'sms-success' : 'sms-error'}>
          <span>{message.type === 'success' ? '✅' : '❌'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Alert Type Cards ───────────────────────────────── */}
      <div>
        <h3>🔔 {T.chooseAlerts}</h3>
        <div className="sms-alert-grid">
          {Object.entries(alertTypes).map(([key, desc]) => (
            <div
              key={key}
              className={`sms-alert-card ${activeAlerts.includes(key) ? 'active' : ''}`}
              onClick={() => toggleAlert(key)}
            >
              <button
                className={`sms-alert-toggle ${activeAlerts.includes(key) ? 'on' : ''}`}
                onClick={e => { e.stopPropagation(); toggleAlert(key); }}
                aria-label={`Toggle ${key}`}
              />
              <div className="sms-alert-card-header">
                <span className="sms-alert-card-icon">{ALERT_ICONS[key] || '📢'}</span>
                <span className="sms-alert-card-title">
                  {T.alertNames?.[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </div>
              <div className="sms-alert-card-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="sms-filters">
        <h3>🎯 {T.filterAlerts}</h3>
        <div className="sms-filter-row">
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">{T.allStates}</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={cropFilter} onChange={e => setCropFilter(e.target.value)}>
            <option value="">{T.allCrops}</option>
            {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Save Button ────────────────────────────────────── */}
      <div className="sms-action-bar">
        <button
          className="sms-btn sms-btn-primary"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? '⏳ ' + T.saving : '💾 ' + T.savePreferences}
        </button>
      </div>

      {/* ── Notification History ───────────────────────────── */}
      <div className="sms-history">
        <h3>📜 {T.history}</h3>
        {history.length === 0 ? (
          <div className="sms-empty">
            <div className="sms-empty-icon">📭</div>
            <div>{T.noHistory}</div>
          </div>
        ) : (
          <table className="sms-history-table">
            <thead>
              <tr>
                <th>{T.date}</th>
                <th>{T.type}</th>
                <th>{T.messageCol}</th>
                <th>{T.status}</th>
              </tr>
            </thead>
            <tbody>
              {history.map(log => (
                <tr key={log.id}>
                  <td>{formatDate(log.sent_at)}</td>
                  <td>
                    <span>{ALERT_ICONS[log.alert_type] || '📢'} </span>
                    {T.alertNames?.[log.alert_type] || log.alert_type}
                  </td>
                  <td>
                    <span className="sms-message-preview" title={log.message}>
                      {log.message}
                    </span>
                  </td>
                  <td>
                    <span className={`sms-badge ${log.status}`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
