// pages/FertilizerPage.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './FertilizerPage.css';

export default function FertilizerPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.fertilizer || translations.en.fertilizer;
  const [soilTypes, setSoilTypes]   = useState([]);
  const [cropTypes, setCropTypes]   = useState([]);
  const [form, setForm]             = useState({ soil_type:'', crop_type:'', nitrogen:'', phosphorus:'', potassium:'' });
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    api.get('/fertilizer/soil-types').then(r => setSoilTypes(r.data.soil_types || []));
    api.get('/fertilizer/crop-types').then(r => setCropTypes(r.data.crop_types || []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/fertilizer/recommend', {
        soil_type: form.soil_type,
        crop_type: form.crop_type,
        nitrogen:  parseFloat(form.nitrogen),
        phosphorus:parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium)
      });
      setResult(res.data.recommendation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get recommendation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      <div className="fert-layout">
        {/* Input Form */}
        <div className="card fert-form-card">
          <h3>{T.enterDetails}</h3>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{T.soilType}</label>
              <select name="soil_type" value={form.soil_type} onChange={handleChange} required>
                <option value="">{T.selectSoil}</option>
                {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>{T.cropType}</label>
              <select name="crop_type" value={form.crop_type} onChange={handleChange} required>
                <option value="">{T.selectCrop}</option>
                {cropTypes.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="npk-grid">
              <div className="form-group">
                <label>{T.nitrogen}</label>
                <input type="number" name="nitrogen" value={form.nitrogen}
                  onChange={handleChange} min="0" placeholder="e.g. 80" required />
              </div>
              <div className="form-group">
                <label>{T.phosphorus}</label>
                <input type="number" name="phosphorus" value={form.phosphorus}
                  onChange={handleChange} min="0" placeholder="e.g. 30" required />
              </div>
              <div className="form-group">
                <label>{T.potassium}</label>
                <input type="number" name="potassium" value={form.potassium}
                  onChange={handleChange} min="0" placeholder="e.g. 25" required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? T.loading : T.getRecommendation}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="card fert-result-card">
            <h3>{T.result}</h3>
            <div className="result-row">
              <span>Soil Type</span><strong>{result.soil_type}</strong>
            </div>
            <div className="result-row">
              <span>Crop</span><strong>{result.crop_type}</strong>
            </div>
            <div className="result-highlight">
              <div className="rh-label">{T.recommended}</div>
              <div className="rh-value">{result.recommended_fertilizer}</div>
            </div>
            <div className="result-highlight">
              <div className="rh-label">{T.quantity}</div>
              <div className="rh-value">{result.quantity_per_acre}</div>
            </div>
            {result.base_notes && (
              <div className="result-notes">
                <strong>📌 Notes:</strong> {result.base_notes}
              </div>
            )}
            {result.npk_adjustment_advice?.length > 0 && (
              <div className="result-npk">
                <strong>🔬 NPK Analysis:</strong>
                <ul>
                  {result.npk_adjustment_advice.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card fert-info">
        <h4>ℹ️ NPK Guidelines</h4>
        <div className="npk-guide">
          <div><strong>Nitrogen (N):</strong> Promotes leafy green growth. Adequate level: 100–150 kg/acre.</div>
          <div><strong>Phosphorus (P):</strong> Supports root development. Adequate level: 30–60 kg/acre.</div>
          <div><strong>Potassium (K):</strong> Improves fruit quality & disease resistance. Adequate level: 40–80 kg/acre.</div>
        </div>
      </div>
    </div>
  );
}
