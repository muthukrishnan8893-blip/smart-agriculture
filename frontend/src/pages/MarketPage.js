// pages/MarketPage.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './MarketPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CROP_EMOJI = {
  Wheat:'🌾', Rice:'🍚', Maize:'🌽', Cotton:'🪴', Groundnut:'🥜',
  Tomato:'🍅', Potato:'🥔', Soybean:'🫘', Onion:'🧅', Sugarcane:'🎋',
  default:'🌿'
};

function getTrend(prices, cropName) {
  const c = prices.filter(p => p.crop_name === cropName).slice(0, 2);
  if (c.length < 2) return 'stable';
  return c[0].price_per_quintal > c[1].price_per_quintal ? 'up' : c[0].price_per_quintal < c[1].price_per_quintal ? 'down' : 'stable';
}

export default function MarketPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.market || translations.en.market;

  const [crops, setCrops]               = useState([]);
  const [prices, setPrices]             = useState([]);
  const [history, setHistory]           = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [prediction, setPrediction]     = useState(null);
  const [search, setSearch]             = useState('');
  const [predForm, setPredForm]         = useState({ crop_name: '', state: '', months_ahead: 3 });
  const [loadingP, setLoadingP]         = useState(false);
  const [loadingH, setLoadingH]         = useState(false);
  const [predError, setPredError]       = useState('');

  useEffect(() => {
    api.get('/market/prices/crops').then(r => setCrops(r.data.crops || []));
    api.get('/market/prices').then(r => setPrices(r.data.prices || []));
  }, []);

  // Deduplicate: latest price per crop
  const latestPrices = useMemo(() => {
    const seen = new Map();
    prices.forEach(p => { if (!seen.has(p.crop_name)) seen.set(p.crop_name, p); });
    return Array.from(seen.values());
  }, [prices]);

  const filtered = useMemo(() =>
    latestPrices.filter(p => p.crop_name.toLowerCase().includes(search.toLowerCase())),
  [latestPrices, search]);

  const loadHistory = async (cropName) => {
    if (selectedCrop === cropName && history.length) { setSelectedCrop(''); setHistory([]); return; }
    setSelectedCrop(cropName);
    setLoadingH(true);
    try {
      const res = await api.get(`/market/prices/history/${cropName}`);
      setHistory(res.data.history || []);
    } finally { setLoadingH(false); }
  };

  const handlePredict = async e => {
    e.preventDefault();
    setPredError(''); setPrediction(null); setLoadingP(true);
    try {
      const res = await api.post('/market/predict', predForm);
      setPrediction(res.data);
    } catch (err) {
      setPredError(err.response?.data?.error || 'Prediction failed');
    } finally { setLoadingP(false); }
  };

  // Gradient chart
  const chartData = useMemo(() => {
    const prices_vals = history.map(h => h.price);
    const max = Math.max(...prices_vals);
    const min = Math.min(...prices_vals);
    return {
      labels: history.map(h => h.date),
      datasets: [{
        label: `${selectedCrop} ₹/Quintal`,
        data: prices_vals,
        borderColor: '#1d6f42',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { width, height } = chart;
          const gradient = chart.ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0,   'rgba(29,111,66,0.35)');
          gradient.addColorStop(1,   'rgba(29,111,66,0.0)');
          return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1d6f42',
        pointRadius: 4,
        pointHoverRadius: 7,
        borderWidth: 2.5,
      }]
    };
  }, [history, selectedCrop]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ₹${ctx.parsed.y.toLocaleString()} / Quintal` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        ticks: { callback: v => `₹${v.toLocaleString()}`, font: { size: 11 } },
        grid: { color: 'rgba(0,0,0,0.05)' }
      }
    }
  };

  return (
    <div className="market-wrapper">
      {/* Header */}
      <div className="market-top-row">
        <h2 className="page-title">🛒 Market Prices</h2>
        <div className="market-search-wrap">
          <input
            className="market-search-input"
            placeholder="🔍  Search crop…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="market-stats-strip">
        <div className="mss-item">
          <div className="mss-val">{latestPrices.length}</div>
          <div className="mss-label">Crops Listed</div>
        </div>
        <div className="mss-item">
          <div className="mss-val">
            ₹{latestPrices.length ? Math.max(...latestPrices.map(p=>p.price_per_quintal)).toLocaleString() : '—'}
          </div>
          <div className="mss-label">Highest Price</div>
        </div>
        <div className="mss-item">
          <div className="mss-val">
            ₹{latestPrices.length ? Math.min(...latestPrices.map(p=>p.price_per_quintal)).toLocaleString() : '—'}
          </div>
          <div className="mss-label">Lowest Price</div>
        </div>
        <div className="mss-item">
          <div className="mss-val">
            ₹{latestPrices.length ? Math.round(latestPrices.reduce((s,p)=>s+p.price_per_quintal,0)/latestPrices.length).toLocaleString() : '—'}
          </div>
          <div className="mss-label">Avg Price</div>
        </div>
      </div>

      {/* Crop Cards Grid */}
      <div className="crop-cards-grid">
        {filtered.length === 0 && (
          <div className="market-empty-state">No crops found for "{search}"</div>
        )}
        {filtered.map(p => {
          const trend   = getTrend(prices, p.crop_name);
          const isOpen  = selectedCrop === p.crop_name;
          const emoji   = CROP_EMOJI[p.crop_name] || CROP_EMOJI.default;
          return (
            <div
              key={p.crop_name}
              className={`crop-price-card card ${isOpen ? 'crop-card-active' : ''}`}
              onClick={() => loadHistory(p.crop_name)}
            >
              <div className="cpc-top">
                <div className="cpc-emoji">{emoji}</div>
                <div className={`cpc-trend-badge trend-${trend}`}>
                  {trend === 'up' ? '▲ Rising' : trend === 'down' ? '▼ Falling' : '● Stable'}
                </div>
              </div>
              <div className="cpc-name">{p.crop_name}</div>
              <div className="cpc-price">₹{p.price_per_quintal.toLocaleString()}</div>
              <div className="cpc-sub">per Quintal</div>
              <div className="cpc-meta">
                <span>📍 {p.market_name || p.state}</span>
                <span>📅 {p.date_recorded}</span>
              </div>
              <div className="cpc-chart-hint">{isOpen ? '▲ Hide Chart' : '📊 View Trend'}</div>
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      {selectedCrop && (
        <div className="card market-chart-card">
          <div className="mcc-header">
            <h3 className="mcc-title">
              {CROP_EMOJI[selectedCrop] || '🌿'} {selectedCrop} — Price Trend
            </h3>
            <button className="mcc-close" onClick={() => { setSelectedCrop(''); setHistory([]); }}>✕</button>
          </div>
          {loadingH ? (
            <div className="mcc-loading">Loading chart…</div>
          ) : history.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="mcc-loading">No history data available.</div>
          )}
        </div>
      )}

      {/* Price Prediction */}
      <div className="card market-predict-card">
        <div className="mpc-header">
          <div>
            <h3 className="mpc-title">🤖 AI Price Prediction</h3>
            <p className="mpc-sub">Predict future crop prices using machine learning</p>
          </div>
        </div>

        <div className="mpc-body">
          <form className="mpc-form" onSubmit={handlePredict}>
            <div className="form-group">
              <label>Crop</label>
              <select value={predForm.crop_name}
                onChange={e => setPredForm({...predForm, crop_name: e.target.value})} required>
                <option value="">Select Crop</option>
                {crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>State (optional)</label>
              <input value={predForm.state}
                onChange={e => setPredForm({...predForm, state: e.target.value})}
                placeholder="e.g. Maharashtra" />
            </div>
            <div className="form-group">
              <label>Months Ahead</label>
              <select value={predForm.months_ahead}
                onChange={e => setPredForm({...predForm, months_ahead: parseInt(e.target.value)})}>
                {[1,2,3,6,9,12].map(m => <option key={m} value={m}>{m} month{m>1?'s':''}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary mpc-btn" disabled={loadingP}>
              {loadingP ? '⏳ Predicting…' : '🎯 Predict Price'}
            </button>
          </form>

          {predError && <div className="weather-error" style={{marginTop:'1rem'}}>{predError}</div>}

          {prediction && (
            <div className="pred-result-hero">
              <div className="prh-emoji">{CROP_EMOJI[prediction.crop_name] || '🌿'}</div>
              <div className="prh-label">Predicted price for {prediction.crop_name}</div>
              <div className="prh-price">₹{prediction.predicted_price.toLocaleString()}</div>
              <div className="prh-unit">per Quintal</div>
              <div className="prh-meta">{prediction.prediction_date} · {prediction.method}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
