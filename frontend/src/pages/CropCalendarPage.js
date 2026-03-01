// pages/CropCalendarPage.js
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './CropCalendarPage.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// type: 'sow' | 'grow' | 'harvest'
const CROPS = [
  {
    name: 'Rice (Paddy)', icon: '🌾', season: 'Kharif',
    soil: 'Alluvial / Clay', water: 'High',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'grow', 10:'harvest', 11:'harvest' },
    tip: 'Keep fields flooded 5–7 cm during vegetative stage. Drain before harvest.'
  },
  {
    name: 'Wheat', icon: '🌾', season: 'Rabi',
    soil: 'Loamy / Sandy Loam', water: 'Moderate',
    months: { 10:'sow', 11:'sow', 0:'grow', 1:'grow', 2:'harvest', 3:'harvest' },
    tip: 'Apply first irrigation at crown-root stage (21 days after sowing).'
  },
  {
    name: 'Maize', icon: '🌽', season: 'Kharif',
    soil: 'Sandy Loam / Loamy', water: 'Moderate',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Earthing up at knee height (30 days) prevents lodging.'
  },
  {
    name: 'Cotton', icon: '🌿', season: 'Kharif',
    soil: 'Black / Deep Loam', water: 'Moderate',
    months: { 4:'sow', 5:'sow', 6:'grow', 7:'grow', 8:'grow', 9:'grow', 10:'harvest', 11:'harvest' },
    tip: 'Monitor bollworm weekly. Reduce irrigation 2 weeks before picking.'
  },
  {
    name: 'Sugarcane', icon: '🎋', season: 'Annual',
    soil: 'Loamy / Alluvial', water: 'Very High',
    months: { 1:'sow', 2:'sow', 3:'grow', 4:'grow', 5:'grow', 6:'grow', 7:'grow', 8:'grow', 9:'grow', 10:'grow', 11:'harvest', 0:'harvest' },
    tip: 'Ratoon crop viable for 2–3 cycles. Top dressing urea at 45 & 90 days.'
  },
  {
    name: 'Soybean', icon: '🫘', season: 'Kharif',
    soil: 'Black / Clay Loam', water: 'Moderate',
    months: { 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Rhizobium seed treatment boosts nitrogen fixation by 30%.'
  },
  {
    name: 'Groundnut', icon: '🥜', season: 'Kharif',
    soil: 'Sandy Loam / Red', water: 'Moderate',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Earth up at pegging stage. Calcium application improves pod filling.'
  },
  {
    name: 'Mustard', icon: '🌼', season: 'Rabi',
    soil: 'Loamy / Sandy', water: 'Low',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'One irrigation at flowering stage is critical for good yield.'
  },
  {
    name: 'Chickpea (Gram)', icon: '🫛', season: 'Rabi',
    soil: 'Sandy Loam / Loamy', water: 'Low',
    months: { 10:'sow', 11:'sow', 0:'grow', 1:'grow', 2:'harvest', 3:'harvest' },
    tip: 'Avoid excess moisture — chickpea prefers dry cool climate.'
  },
  {
    name: 'Tomato', icon: '🍅', season: 'Rabi / Zaid',
    soil: 'Well-drained Sandy Loam', water: 'Moderate',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest', 3:'harvest' },
    tip: 'Stake plants at 30 cm height. Weekly foliar spray reduces blight.'
  },
  {
    name: 'Onion', icon: '🧅', season: 'Rabi',
    soil: 'Sandy Loam / Alluvial', water: 'Moderate',
    months: { 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest', 3:'harvest' },
    tip: 'Stop irrigation 10 days before harvest to improve storage life.'
  },
  {
    name: 'Potato', icon: '🥔', season: 'Rabi',
    soil: 'Sandy Loam / Loamy', water: 'Moderate',
    months: { 9:'sow', 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'Hill up soil at 30 days. Harvest when foliage turns yellow.'
  },
  {
    name: 'Sunflower', icon: '🌻', season: 'Rabi / Kharif',
    soil: 'Sandy Loam / Black', water: 'Moderate',
    months: { 10:'sow', 11:'grow', 0:'grow', 1:'harvest', 2:'harvest' },
    tip: 'Cover heads with cloth at grain-fill stage to prevent bird damage.'
  },
  {
    name: 'Bajra (Pearl Millet)', icon: '🌾', season: 'Kharif',
    soil: 'Sandy / Loamy', water: 'Low',
    months: { 5:'sow', 6:'sow', 7:'grow', 8:'grow', 9:'harvest', 10:'harvest' },
    tip: 'Drought tolerant — ideal for arid regions. Thin to 1 plant per hill.'
  },
];

const SEASON_FILTER = ['All', 'Kharif', 'Rabi', 'Zaid', 'Annual'];

const CELL_STYLES = {
  sow:     { bg: '#e8f5e9', color: '#2e7d32', label: 'Sow' },
  grow:    { bg: '#c8e6c9', color: '#1b5e20', label: 'Grow' },
  harvest: { bg: '#fff3e0', color: '#e65100', label: 'Harvest' },
  none:    { bg: 'transparent', color: 'transparent', label: '' },
};

export default function CropCalendarPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.calendar || translations.en.calendar;
  const [season, setSeason]     = useState('All');
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const curMonth = new Date().getMonth(); // 0-11

  const filtered = CROPS.filter(c => {
    const matchSeason = season === 'All' || c.season.includes(season);
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchSeason && matchSearch;
  });

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Filters */}
      <div className="cal-filters card">
        <input
          className="cal-search"
          placeholder="🔍 Search crop..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="season-btns">
          {SEASON_FILTER.map(s => (
            <button
              key={s}
              className={`season-btn ${season === s ? 'active' : ''}`}
              onClick={() => setSeason(s)}
            >{s}</button>
          ))}
        </div>
        <div className="cal-legend">
          <span className="leg-item leg-sow">Sow</span>
          <span className="leg-item leg-grow">Grow</span>
          <span className="leg-item leg-harvest">Harvest</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="cal-table-wrap card" style={{overflowX:'auto'}}>
        <table className="cal-table">
          <thead>
            <tr>
              <th className="crop-col">Crop</th>
              {MONTHS.map((m, i) => (
                <th key={i} className={`month-col ${i === curMonth ? 'cur-month' : ''}`}>
                  {m}
                  {i === curMonth && <span className="cur-dot" />}
                </th>
              ))}
              <th className="season-col">Season</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(crop => (
              <tr
                key={crop.name}
                className={`cal-row ${selected?.name === crop.name ? 'row-selected' : ''}`}
                onClick={() => setSelected(selected?.name === crop.name ? null : crop)}
              >
                <td className="crop-name-cell">
                  <span className="crop-icon">{crop.icon}</span>
                  <span>{crop.name}</span>
                </td>
                {MONTHS.map((_, i) => {
                  const type = crop.months[i] || 'none';
                  const s = CELL_STYLES[type];
                  return (
                    <td
                      key={i}
                      className={`cal-cell ${type !== 'none' ? 'has-type' : ''} ${i === curMonth ? 'cur-month-col' : ''}`}
                      style={{ background: s.bg }}
                      title={type !== 'none' ? `${crop.name} — ${s.label}` : ''}
                    >
                      {type !== 'none' && (
                        <span className="cell-dot" style={{ background: s.color }} />
                      )}
                    </td>
                  );
                })}
                <td>
                  <span className={`season-tag tag-${crop.season.split('/')[0].trim().toLowerCase()}`}>
                    {crop.season}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={14} style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No crops found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Crop Detail Card */}
      {selected && (
        <div className="crop-detail card">
          <div className="cd-header">
            <span className="cd-icon">{selected.icon}</span>
            <div>
              <h3 className="cd-name">{selected.name}</h3>
              <span className={`season-tag tag-${selected.season.split('/')[0].trim().toLowerCase()}`}>{selected.season}</span>
            </div>
            <button className="cd-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="cd-body">
            <div className="cd-stat"><span className="cd-label">🌿 Soil Type</span><span>{selected.soil}</span></div>
            <div className="cd-stat"><span className="cd-label">💧 Water Need</span><span>{selected.water}</span></div>
            <div className="cd-stat cd-months">
              <span className="cd-label">📅 Months</span>
              <div className="month-chips">
                {MONTHS.map((m, i) => {
                  const type = selected.months[i];
                  if (!type) return null;
                  return (
                    <span key={i} className={`month-chip chip-${type}`}>{m} ({CELL_STYLES[type].label})</span>
                  );
                })}
              </div>
            </div>
            <div className="cd-tip">
              <span className="cd-label">💡 Tip</span>
              <p>{selected.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Month Info */}
      <div className="cal-info card">
        <h4>📅 {MONTHS[curMonth]} — What to do this month</h4>
        <div className="now-list">
          {(() => {
            const sow = CROPS.filter(c => c.months[curMonth] === 'sow');
            const harvest = CROPS.filter(c => c.months[curMonth] === 'harvest');
            const grow = CROPS.filter(c => c.months[curMonth] === 'grow');
            return (
              <>
                {sow.length > 0 && <div className="now-row"><span className="now-badge badge-sow">🌱 Sow</span>{sow.map(c => `${c.icon} ${c.name}`).join(' · ')}</div>}
                {grow.length > 0 && <div className="now-row"><span className="now-badge badge-grow">🌿 Growing</span>{grow.map(c => `${c.icon} ${c.name}`).join(' · ')}</div>}
                {harvest.length > 0 && <div className="now-row"><span className="now-badge badge-harvest">🍂 Harvest</span>{harvest.map(c => `${c.icon} ${c.name}`).join(' · ')}</div>}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
