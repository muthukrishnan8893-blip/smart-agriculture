// pages/PriceComparisonPage.js - Price Comparison Tool
import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './PriceComparisonPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PriceComparisonPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.priceCompare || translations.en.priceCompare;

  const [crops, setCrops]           = useState([]);
  const [states, setStates]         = useState([]);
  const [selectedCrop, setSelectedCrop]   = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [userLoc, setUserLoc]       = useState(null);
  const [locating, setLocating]     = useState(false);

  // Load crops and states on mount
  useEffect(() => {
    Promise.all([
      api.get('/market/compare/crops'),
      api.get('/market/compare/states'),
    ]).then(([c, s]) => {
      setCrops(c.data.crops || []);
      setStates(s.data.states || []);
    });
  }, []);

  // GPS
  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  // Compare
  const compare = useCallback(async () => {
    if (!selectedCrop) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ crop: selectedCrop });
      if (selectedState) params.set('state', selectedState);
      if (userLoc) { params.set('lat', userLoc.lat); params.set('lng', userLoc.lng); }
      const res = await api.get(`/market/compare?${params}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, selectedState, userLoc]);

  const mapsUrl = (lat, lng, name) =>
    `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;

  // Chart
  const chartData = results ? {
    labels: results.results.slice(0, 15).map(r => r.mandi_name.length > 20 ? r.mandi_name.slice(0, 18) + '…' : r.mandi_name),
    datasets: [{
      label: `${results.crop} ₹/Quintal`,
      data: results.results.slice(0, 15).map(r => r.price),
      backgroundColor: results.results.slice(0, 15).map(r =>
        r.tag === 'best' ? 'rgba(29,111,66,0.7)' :
        r.tag === 'worst' ? 'rgba(220,53,69,0.6)' :
        'rgba(59,130,246,0.5)'
      ),
      borderColor: results.results.slice(0, 15).map(r =>
        r.tag === 'best' ? '#1d6f42' :
        r.tag === 'worst' ? '#dc3545' :
        '#3b82f6'
      ),
      borderWidth: 2,
      borderRadius: 6,
    }]
  } : null;

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: T.chartTitle || 'Price Comparison Across Mandis', font: { size: 14 } },
      tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}/Quintal` } },
    },
    scales: {
      x: { ticks: { callback: v => `₹${v.toLocaleString('en-IN')}` } },
    }
  };

  return (
    <div className="compare-page">
      <h2>{T.title}</h2>
      <p style={{ color: 'var(--text-muted, #888)', marginTop: '-0.8rem' }}>{T.subtitle}</p>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="compare-filters">
        <h3>🔍 {T.searchTitle}</h3>
        <div className="compare-filter-row">
          <select value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)}>
            <option value="">{T.selectCrop}</option>
            {crops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)}>
            <option value="">{T.allStates}</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className="compare-gps-btn"
            onClick={getLocation}
            disabled={locating}
            title={T.gpsTooltip}
          >
            {locating ? '⏳' : '📡'} {userLoc ? T.gpsActive : T.gpsBtn}
          </button>
          <button
            className="compare-btn"
            onClick={compare}
            disabled={!selectedCrop || loading}
          >
            {loading ? '⏳ ' + T.comparing : '📊 ' + T.compareBtn}
          </button>
        </div>
      </div>

      {/* ── Recommendation Banner ───────────────────────────── */}
      {results && results.results.length > 0 && (
        <div className="compare-recommendation">
          <div className="compare-rec-icon">🏆</div>
          <div className="compare-rec-content">
            <div className="compare-rec-title">{T.bestSelling}: {results.results[0].mandi_name}</div>
            <div className="compare-rec-detail">
              {results.results[0].city}, {results.results[0].state}
              {results.results[0].distance_km != null && ` · ${results.results[0].distance_km} km ${T.away}`}
              {' · '}{results.results[0].timings}
            </div>
            <div className="compare-rec-detail" style={{ marginTop: '0.3rem' }}>
              💰 {T.youCouldEarn} <strong>₹{results.potential_gain?.toLocaleString('en-IN')}</strong> {T.morePerQuintal}
            </div>
          </div>
          <div className="compare-rec-price">₹{results.best_price?.toLocaleString('en-IN')}</div>
        </div>
      )}

      {/* ── Summary Stats ───────────────────────────────────── */}
      {results && results.results.length > 0 && (
        <div className="compare-summary">
          <div className="compare-summary-card best">
            <div className="compare-summary-icon">📈</div>
            <div className="compare-summary-value">₹{results.best_price?.toLocaleString('en-IN')}</div>
            <div className="compare-summary-label">{T.bestPrice}</div>
          </div>
          <div className="compare-summary-card worst">
            <div className="compare-summary-icon">📉</div>
            <div className="compare-summary-value">₹{results.worst_price?.toLocaleString('en-IN')}</div>
            <div className="compare-summary-label">{T.worstPrice}</div>
          </div>
          <div className="compare-summary-card">
            <div className="compare-summary-icon">📊</div>
            <div className="compare-summary-value">₹{results.avg_price?.toLocaleString('en-IN')}</div>
            <div className="compare-summary-label">{T.avgPrice}</div>
          </div>
          <div className="compare-summary-card gain">
            <div className="compare-summary-icon">💰</div>
            <div className="compare-summary-value">₹{results.potential_gain?.toLocaleString('en-IN')}</div>
            <div className="compare-summary-label">{T.potentialGain}</div>
          </div>
          <div className="compare-summary-card">
            <div className="compare-summary-icon">🏪</div>
            <div className="compare-summary-value">{results.total_mandis}</div>
            <div className="compare-summary-label">{T.mandisFound}</div>
          </div>
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────── */}
      {chartData && (
        <div className="compare-results">
          <Bar data={chartData} options={chartOptions} height={Math.max(200, results.results.slice(0, 15).length * 35)} />
        </div>
      )}

      {/* ── Results Table ───────────────────────────────────── */}
      {results && results.results.length > 0 ? (
        <div className="compare-results">
          <h3>📋 {T.detailedResults} ({results.total_mandis} {T.mandis})</h3>
          <table className="compare-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th>{T.mandi}</th>
                <th>{T.location}</th>
                <th className="price-col">{T.price}</th>
                <th>{T.vsAvg}</th>
                {userLoc && <th>{T.distance}</th>}
                <th>{T.source}</th>
                <th>{T.actions}</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map((r, i) => (
                <tr key={i}>
                  <td className="rank-col">
                    <span className={`rank-badge ${i < 3 ? `rank-${i + 1}` : 'rank-other'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{r.mandi_name}</strong>
                    {r.tag === 'best' && <span className="compare-tag best">{T.bestTag}</span>}
                    {r.tag === 'worst' && <span className="compare-tag worst">{T.worstTag}</span>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #999)', marginTop: '0.15rem' }}>
                      🕐 {r.timings}
                    </div>
                  </td>
                  <td>{r.city}, {r.state}</td>
                  <td className="price-col">₹{r.price?.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`compare-diff ${r.diff_from_avg > 0 ? 'positive' : r.diff_from_avg < 0 ? 'negative' : 'neutral'}`}>
                      {r.diff_from_avg > 0 ? '+' : ''}{r.diff_from_avg?.toLocaleString('en-IN')}
                      {' '}({r.diff_percent > 0 ? '+' : ''}{r.diff_percent}%)
                    </span>
                  </td>
                  {userLoc && <td>{r.distance_km != null ? `${r.distance_km} km` : '-'}</td>}
                  <td>
                    <span className={`compare-source ${r.source}`}>
                      {r.source === 'live' ? '🟢 ' + T.live : '📊 ' + T.typical}
                    </span>
                  </td>
                  <td>
                    <a
                      className="compare-maps-link"
                      href={mapsUrl(r.lat, r.lng, r.mandi_name)}
                      target="_blank" rel="noopener noreferrer"
                    >
                      🗺️ {T.openMap}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && results && (
        <div className="compare-empty">
          <div className="compare-empty-icon">🔍</div>
          <div className="compare-empty-text">{T.noResults}</div>
        </div>
      )}

      {/* ── If no search yet ────────────────────────────────── */}
      {!results && !loading && (
        <div className="compare-empty">
          <div className="compare-empty-icon">📊</div>
          <div className="compare-empty-text">{T.placeholder}</div>
        </div>
      )}
    </div>
  );
}
