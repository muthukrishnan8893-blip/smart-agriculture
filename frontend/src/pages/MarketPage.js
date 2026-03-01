// pages/MarketPage.js
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './MarketPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MarketPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.market || translations.en.market;
  const [crops, setCrops]         = useState([]);
  const [prices, setPrices]       = useState([]);
  const [history, setHistory]     = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [prediction, setPrediction]     = useState(null);
  const [filter, setFilter]             = useState({ crop: '', state: '' });
  const [predForm, setPredForm]         = useState({ crop_name: '', state: '', months_ahead: 3 });
  const [loadingP, setLoadingP]         = useState(false);
  const [predError, setPredError]       = useState('');

  useEffect(() => {
    api.get('/market/prices/crops').then(r => setCrops(r.data.crops || []));
    fetchPrices();
  }, []);

  const fetchPrices = async (crop = '', state = '') => {
    const params = new URLSearchParams();
    if (crop)  params.set('crop', crop);
    if (state) params.set('state', state);
    const res = await api.get(`/market/prices?${params}`);
    setPrices(res.data.prices || []);
  };

  const handleFilterChange = async e => {
    const updated = { ...filter, [e.target.name]: e.target.value };
    setFilter(updated);
    fetchPrices(updated.crop, updated.state);
  };

  const loadHistory = async (cropName) => {
    setSelectedCrop(cropName);
    const res = await api.get(`/market/prices/history/${cropName}`);
    setHistory(res.data.history || []);
  };

  const handlePredict = async e => {
    e.preventDefault();
    setPredError('');
    setPrediction(null);
    setLoadingP(true);
    try {
      const res = await api.post('/market/predict', predForm);
      setPrediction(res.data);
    } catch (err) {
      setPredError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoadingP(false);
    }
  };

  // Chart data
  const chartData = {
    labels: history.map(h => h.date),
    datasets: [{
      label: `${selectedCrop} Price (₹/Quintal)`,
      data: history.map(h => h.price),
      borderColor: '#2e7d32',
      backgroundColor: 'rgba(46,125,50,0.1)',
      tension: 0.3,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Price Trend - ${selectedCrop}` }
    },
    scales: {
      y: { ticks: { callback: v => `₹${v}` } }
    }
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Filters */}
      <div className="card market-filters">
        <div className="form-group" style={{flex:1}}>
          <label>{T.filterCrop}</label>
          <select name="crop" value={filter.crop} onChange={handleFilterChange}>
            <option value="">All Crops</option>
            {crops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{flex:1}}>
          <label>{T.filterState}</label>
          <input name="state" value={filter.state} onChange={handleFilterChange} placeholder="e.g. Maharashtra" />
        </div>
      </div>

      {/* Price Table */}
      <div className="card" style={{marginBottom:'1.5rem', overflowX:'auto'}}>
        <table className="price-table">
          <thead>
            <tr><th>Crop</th><th>Market</th><th>State</th><th>District</th><th>Price/Quintal</th><th>Date</th><th>Trend</th></tr>
          </thead>
          <tbody>
            {prices.length === 0 && (
              <tr><td colSpan="7" style={{textAlign:'center',color:'var(--text-muted)'}}>No price records found</td></tr>
            )}
            {prices.map(p => (
              <tr key={p.id}>
                <td><strong>{p.crop_name}</strong></td>
                <td>{p.market_name || '—'}</td>
                <td>{p.state}</td>
                <td>{p.district}</td>
                <td className="price-col">₹{p.price_per_quintal.toLocaleString()}</td>
                <td>{p.date_recorded}</td>
                <td>
                  <button className="btn-trend" onClick={() => loadHistory(p.crop_name)}>
                    📊 View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price Trend Chart */}
      {history.length > 0 && (
        <div className="card" style={{marginBottom:'1.5rem'}}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* ML Price Prediction */}
      <div className="card pred-card">
        <h3>🤖 Price Prediction (ML)</h3>
        {predError && <div className="error-msg">{predError}</div>}
        <form className="pred-form" onSubmit={handlePredict}>
          <div className="form-group">
            <label>Crop Name</label>
            <select value={predForm.crop_name}
              onChange={e => setPredForm({...predForm, crop_name: e.target.value})} required>
              <option value="">Select Crop</option>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>State</label>
            <input value={predForm.state}
              onChange={e => setPredForm({...predForm, state: e.target.value})}
              placeholder="e.g. Maharashtra" />
          </div>
          <div className="form-group">
            <label>Months Ahead</label>
            <select value={predForm.months_ahead}
              onChange={e => setPredForm({...predForm, months_ahead: parseInt(e.target.value)})}>
              {[1,2,3,6,9,12].map(m => <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-secondary" disabled={loadingP}>
            {loadingP ? 'Predicting...' : '🎯 Predict Price'}
          </button>
        </form>

        {prediction && (
          <div className="pred-result">
            <div className="pr-label">Predicted Price for {prediction.crop_name}</div>
            <div className="pr-price">₹{prediction.predicted_price.toLocaleString()} / Quintal</div>
            <div className="pr-meta">
              As of {prediction.prediction_date} • Method: {prediction.method}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
