// pages/CropCalendarPage.js
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './CropCalendarPage.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const CROPS = [
  {
    name: 'Rice (Paddy)', icon: '🌾', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Alluvial / Clay', water: 'High 💧💧💧',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'grow', 10:'harvest', 11:'harvest' },
    tip: 'Keep fields flooded 5-7 cm during vegetative stage. Drain 2 weeks before harvest.',
    bestState: 'West Bengal, Punjab, Andhra Pradesh',
  },
  {
    name: 'Wheat', icon: '🌾', season: 'Rabi', seasonColor: '#d97706',
    soil: 'Loamy / Sandy Loam', water: 'Moderate 💧💧',
    months: { 10:'sow', 11:'sow', 0:'grow', 1:'grow', 2:'harvest', 3:'harvest' },
    tip: 'Apply first irrigation at crown-root stage (21 days after sowing).',
    bestState: 'Punjab, Haryana, Uttar Pradesh',
  },
  {
    name: 'Maize', icon: '🌽', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Sandy Loam / Loamy', water: 'Moderate 💧💧',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Earthing up at knee height (30 days) prevents lodging.',
    bestState: 'Karnataka, Andhra Pradesh, Rajasthan',
  },
  {
    name: 'Cotton', icon: '🌿', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Black / Deep Loam', water: 'Moderate 💧💧',
    months: { 4:'sow', 5:'sow', 6:'grow', 7:'grow', 8:'grow', 9:'grow', 10:'harvest', 11:'harvest' },
    tip: 'Monitor bollworm weekly. Reduce irrigation 2 weeks before picking.',
    bestState: 'Gujarat, Maharashtra, Telangana',
  },
  {
    name: 'Sugarcane', icon: '🎋', season: 'Annual', seasonColor: '#0891b2',
    soil: 'Loamy / Alluvial', water: 'Very High 💧💧💧💧',
    months: { 1:'sow', 2:'sow', 3:'grow', 4:'grow', 5:'grow', 6:'grow', 7:'grow', 8:'grow', 9:'grow', 10:'grow', 11:'harvest', 0:'harvest' },
    tip: 'Ratoon crop viable for 2-3 cycles. Top dressing urea at 45 & 90 days.',
    bestState: 'Uttar Pradesh, Maharashtra, Karnataka',
  },
  {
    name: 'Soybean', icon: '🫘', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Black / Clay Loam', water: 'Moderate 💧💧',
    months: { 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Rhizobium seed treatment boosts nitrogen fixation by 30%.',
    bestState: 'Madhya Pradesh, Maharashtra, Rajasthan',
  },
  {
    name: 'Groundnut', icon: '🥜', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Sandy Loam / Red', water: 'Moderate 💧💧',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Earth up at pegging stage. Calcium application improves pod filling.',
    bestState: 'Gujarat, Andhra Pradesh, Tamil Nadu',
  },
  {
    name: 'Mustard', icon: '🌼', season: 'Rabi', seasonColor: '#d97706',
    soil: 'Loamy / Sandy', water: 'Low 💧',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'One irrigation at flowering stage is critical for good yield.',
    bestState: 'Rajasthan, Uttar Pradesh, Haryana',
  },
  {
    name: 'Chickpea (Gram)', icon: '🫙', season: 'Rabi', seasonColor: '#d97706',
    soil: 'Sandy Loam / Loamy', water: 'Low 💧',
    months: { 10:'sow', 11:'sow', 0:'grow', 1:'grow', 2:'harvest', 3:'harvest' },
    tip: 'Avoid excess moisture - chickpea prefers dry cool climate.',
    bestState: 'Madhya Pradesh, Rajasthan, Maharashtra',
  },
  {
    name: 'Tomato', icon: '🍅', season: 'Rabi / Zaid', seasonColor: '#dc2626',
    soil: 'Well-drained Sandy Loam', water: 'Moderate 💧💧',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest', 3:'harvest' },
    tip: 'Stake plants at 30 cm height. Weekly foliar spray reduces blight.',
    bestState: 'Andhra Pradesh, Karnataka, Maharashtra',
  },
  {
    name: 'Onion', icon: '🧅', season: 'Rabi', seasonColor: '#d97706',
    soil: 'Sandy Loam / Alluvial', water: 'Moderate 💧💧',
    months: { 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest', 3:'harvest' },
    tip: 'Stop irrigation 10 days before harvest to improve storage life.',
    bestState: 'Maharashtra, Karnataka, Madhya Pradesh',
  },
  {
    name: 'Potato', icon: '🥔', season: 'Rabi', seasonColor: '#d97706',
    soil: 'Sandy Loam / Loamy', water: 'Moderate 💧💧',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'Hill up soil at 30 days. Harvest when foliage turns yellow.',
    bestState: 'Uttar Pradesh, West Bengal, Punjab',
  },
  {
    name: 'Sunflower', icon: '🌻', season: 'Rabi / Kharif', seasonColor: '#d97706',
    soil: 'Sandy Loam / Black', water: 'Moderate 💧💧',
    months: { 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'Cover heads with cloth at grain-fill to prevent bird damage.',
    bestState: 'Karnataka, Andhra Pradesh, Maharashtra',
  },
  {
    name: 'Bajra (Pearl Millet)', icon: '🌾', season: 'Kharif', seasonColor: '#16a34a',
    soil: 'Sandy / Loamy', water: 'Low 💧',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Drought tolerant - ideal for arid regions. Thin to 1 plant per hill.',
    bestState: 'Rajasthan, Maharashtra, Uttar Pradesh',
  },
];

const SEASON_FILTERS = ['All', 'Kharif', 'Rabi', 'Annual'];

const PHASE = {
  sow:     { label: 'Sowing',     emoji: '🌱', bg: '#dcfce7', fg: '#15803d', bar: '#22c55e' },
  grow:    { label: 'Growing',    emoji: '🌿', bg: '#bbf7d0', fg: '#166534', bar: '#16a34a' },
  harvest: { label: 'Harvesting', emoji: '🍂', bg: '#fef3c7', fg: '#92400e', bar: '#f59e0b' },
};

export default function CropCalendarPage() {
  const { lang } = useLanguage();
  const curMonth = new Date().getMonth();
  const [season, setSeason]     = useState('All');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = CROPS.filter(c => {
    const matchSeason = season === 'All' || c.season.includes(season);
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchSeason && matchSearch;
  });

  const thisMonth = {
    sow:     CROPS.filter(c => c.months[curMonth] === 'sow'),
    grow:    CROPS.filter(c => c.months[curMonth] === 'grow'),
    harvest: CROPS.filter(c => c.months[curMonth] === 'harvest'),
  };

  const getCropCurrentPhase = (crop) => crop.months[curMonth] || null;

  return (
    <div className="cc-wrapper">
      <h2 className="page-title">🗓️ Crop Calendar</h2>

      {/* THIS MONTH BANNER */}
      <div className="this-month-banner card">
        <div className="tmb-header">
          <div className="tmb-month">📅 {FULL_MONTHS[curMonth]} — What to do this month</div>
        </div>
        <div className="tmb-rows">
          {['sow','grow','harvest'].map(phase => thisMonth[phase].length > 0 && (
            <div key={phase} className="tmb-row">
              <span className="tmb-badge" style={{background: PHASE[phase].bg, color: PHASE[phase].fg}}>
                {PHASE[phase].emoji} {PHASE[phase].label}
              </span>
              <div className="tmb-crops">
                {thisMonth[phase].map(c => (
                  <span key={c.name} className="tmb-crop-chip" onClick={() => setSelected(c)}>
                    {c.icon} {c.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="cc-controls card">
        <input
          className="cc-search"
          placeholder="🔍  Search crop name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="cc-season-btns">
          {SEASON_FILTERS.map(s => (
            <button key={s}
              className={`cc-sbtn ${season === s ? 'active' : ''}`}
              onClick={() => setSeason(s)}>
              {s === 'Kharif' ? '🌧️ Kharif' : s === 'Rabi' ? '❄️ Rabi' : s === 'Annual' ? '📆 Annual' : '🌿 All'}
            </button>
          ))}
        </div>
        <div className="cc-legend">
          {Object.entries(PHASE).map(([k,v]) => (
            <span key={k} className="cc-leg-item" style={{background: v.bg, color: v.fg}}>
              {v.emoji} {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* CROP CARDS */}
      <div className="cc-cards-grid">
        {filtered.length === 0 && (
          <div className="cc-empty">No crops found for "{search}"</div>
        )}
        {filtered.map(crop => {
          const currentPhase = getCropCurrentPhase(crop);
          const ph = currentPhase ? PHASE[currentPhase] : null;
          const isSelected = selected?.name === crop.name;
          return (
            <div
              key={crop.name}
              className={`cc-crop-card card ${isSelected ? 'cc-card-active' : ''}`}
              onClick={() => setSelected(isSelected ? null : crop)}
            >
              <div className="ccc-top">
                <span className="ccc-icon">{crop.icon}</span>
                <div className="ccc-right-top">
                  <span className="ccc-season-badge" style={{background: crop.seasonColor + '22', color: crop.seasonColor}}>
                    {crop.season}
                  </span>
                  {ph && (
                    <span className="ccc-now-badge" style={{background: ph.bg, color: ph.fg}}>
                      {ph.emoji} {ph.label} now
                    </span>
                  )}
                </div>
              </div>

              <div className="ccc-name">{crop.name}</div>

              <div className="ccc-timeline">
                {MONTHS.map((m, i) => {
                  const type = crop.months[i];
                  const ph2  = type ? PHASE[type] : null;
                  return (
                    <div
                      key={i}
                      className={`ccc-bar-seg ${i === curMonth ? 'ccc-seg-now' : ''}`}
                      style={{ background: ph2 ? ph2.bar : 'rgba(0,0,0,0.06)' }}
                      title={`${m}: ${type ? ph2.label : 'Idle'}`}
                    >
                      {i === curMonth && <div className="ccc-now-pin" />}
                    </div>
                  );
                })}
              </div>
              <div className="ccc-month-labels">
                {MONTHS.map((m,i) => (
                  <span key={i} className={`ccc-mlabel ${i === curMonth ? 'ccc-mlabel-now' : ''}`}>{m}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL DRAWER */}
      {selected && (
        <div className="cc-detail-drawer card">
          <div className="cdd-header">
            <span className="cdd-icon">{selected.icon}</span>
            <div className="cdd-titles">
              <h3 className="cdd-name">{selected.name}</h3>
              <span className="ccc-season-badge" style={{background: selected.seasonColor+'22', color: selected.seasonColor}}>
                {selected.season} Season
              </span>
            </div>
            <button className="cdd-close" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div className="cdd-stats">
            <div className="cdds-item">
              <div className="cdds-label">🌍 Best Grown In</div>
              <div className="cdds-val">{selected.bestState}</div>
            </div>
            <div className="cdds-item">
              <div className="cdds-label">🌿 Soil Type</div>
              <div className="cdds-val">{selected.soil}</div>
            </div>
            <div className="cdds-item">
              <div className="cdds-label">💧 Water Need</div>
              <div className="cdds-val">{selected.water}</div>
            </div>
          </div>

          <div className="cdd-phases-title">📅 Month-by-Month Plan</div>
          <div className="cdd-phases">
            {MONTHS.map((m, i) => {
              const type = selected.months[i];
              if (!type) return null;
              const ph = PHASE[type];
              return (
                <div key={i} className="cdd-phase-chip"
                  style={{background: ph.bg, border: `1.5px solid ${ph.bar}`, color: ph.fg}}>
                  <span className="cdd-phase-month">{m}</span>
                  <span className="cdd-phase-label">{ph.emoji} {ph.label}</span>
                </div>
              );
            })}
          </div>

          <div className="cdd-tip">
            <span className="cdd-tip-icon">💡</span>
            <div>
              <div className="cdd-tip-title">Expert Tip</div>
              <div className="cdd-tip-text">{selected.tip}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
