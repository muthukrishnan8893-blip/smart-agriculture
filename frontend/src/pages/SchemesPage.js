// pages/SchemesPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './SchemesPage.css';

const STATES = [
  'All States','Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha',
  'Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh',
  'Uttarakhand','West Bengal'
];

const CROPS = [
  'All','Wheat','Rice','Maize','Cotton','Groundnut',
  'Tomato','Potato','Soybean','Onion','Sugarcane'
];

export default function SchemesPage() {
  const { user }  = useAuth();
  const { lang } = useLanguage();
  const T = translations[lang]?.schemes || translations.en.schemes;
  const [schemes, setSchemes]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [state, setState]           = useState(user?.state || '');
  const [crop, setCrop]             = useState(user?.crop_type || '');
  const [deadlineSoon, setDeadlineSoon] = useState(false);
  const [expanded, setExpanded]     = useState(null);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (state) params.set('state', state);
      if (crop && crop !== 'All') params.set('crop', crop);
      if (deadlineSoon) params.set('deadline_soon', 'true');
      const res = await api.get(`/schemes/?${params}`);
      setSchemes(res.data.schemes || []);
    } catch (e) {
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []); // eslint-disable-line

  const daysUntil = dateStr => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Filters */}
      <div className="card scheme-filters">
        <div className="form-group">
          <label>{T.filterState}</label>
          <select value={state} onChange={e => setState(e.target.value)}>
            {STATES.map(s => <option key={s} value={s === 'All States' ? '' : s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>{T.filterCrop}</label>
          <select value={crop} onChange={e => setCrop(e.target.value)}>
            {CROPS.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group deadline-toggle">
          <label>
            <input type="checkbox" checked={deadlineSoon} onChange={e => setDeadlineSoon(e.target.checked)} />
            {' '}Deadline in 30 days
          </label>
        </div>
        <button className="btn btn-primary" onClick={fetchSchemes}>🔍 Filter</button>
      </div>

      {loading && <div className="spinner" />}

      {!loading && schemes.length === 0 && (
        <div className="card" style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>
          No schemes found for the selected filters.
        </div>
      )}

      <div className="schemes-list">
        {schemes.map(s => {
          const days = daysUntil(s.deadline);
          return (
            <div key={s.id} className={`scheme-card card ${s.deadline_alert ? 'alert' : ''}`}>
              <div className="sc-header" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div>
                  <div className="sc-title">{s.scheme_name}</div>
                  <div className="sc-tags">
                    {s.applicable_states && (
                      <span className="badge badge-green">📍 {s.applicable_states.split(',').slice(0,2).join(', ')}</span>
                    )}
                    {s.applicable_crops && (
                      <span className="badge badge-amber">🌾 {s.applicable_crops.split(',').slice(0,3).join(', ')}</span>
                    )}
                    {s.deadline_alert && (
                      <span className="badge badge-red">⏰ Deadline Soon!</span>
                    )}
                  </div>
                </div>
                <div className="sc-arrow">{expanded === s.id ? '▲' : '▼'}</div>
              </div>

              {expanded === s.id && (
                <div className="sc-body">
                  <p className="sc-desc">{s.description}</p>
                  {s.benefit && (
                    <div className="sc-benefit">
                      <strong>💰 Benefit:</strong> {s.benefit}
                    </div>
                  )}
                  {s.deadline && (
                    <div className={`sc-deadline ${days !== null && days <= 30 ? 'urgent' : ''}`}>
                      <strong>📅 Deadline:</strong> {s.deadline}
                      {days !== null && days > 0 && ` (${days} days left)`}
                      {days !== null && days <= 0 && ' (Expired)'}
                    </div>
                  )}
                  {s.apply_link && (
                    <a href={s.apply_link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{marginTop:'0.8rem',fontSize:'0.88rem'}}>
                      🔗 Apply Now
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
