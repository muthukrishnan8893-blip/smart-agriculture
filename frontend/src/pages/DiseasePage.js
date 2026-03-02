// pages/DiseasePage.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './DiseasePage.css';

export default function DiseasePage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.disease || translations.en.disease;
  const [tab, setTab]           = useState('detect');
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  // History
  const [history, setHistory]   = useState([]);
  const [hLoading, setHLoading] = useState(false);
  const inputRef = useRef();

  const loadHistory = useCallback(async () => {
    setHLoading(true);
    try {
      const res = await api.get('/disease/history');
      setHistory(res.data.detections || []);
    } catch { setHistory([]); }
    finally { setHLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    // Basic client-side type check
    if (!f.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const handleDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Only image files are allowed.'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) { setError(T.uploadError); return; }
    setLoading(true);
    setError('');
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/disease/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Detection failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (conf) => {
    if (conf > 0.8) return '#2e7d32';
    if (conf > 0.5) return '#f57c00';
    return '#c62828';
  };

  const isHealthy = result?.disease?.includes('Healthy');

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Tabs */}
      <div className="tab-bar" style={{marginBottom:'1.5rem'}}>
        <button className={`tab-btn ${tab === 'detect' ? 'active' : ''}`} onClick={() => setTab('detect')}>🔍 {T.detect}</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>🕒 {T.history}</button>
      </div>

      {tab === 'detect' && (
        <>
          <div className="disease-layout">
            {/* Upload Section */}
            <div className="card disease-upload">
              <h3>{T.upload}</h3>
              <div
                className="drop-zone"
                onClick={() => inputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {preview ? (
                  <img src={preview} alt="Leaf preview" className="leaf-preview" />
                ) : (
                  <div className="drop-placeholder">
                    <span>🌿</span>
                    <p>{T.dragDrop}</p>
                    <small>Upload a clear photo of a <strong>crop leaf</strong> only · JPG / PNG</small>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />

              {/* Leaf-only reminder badge */}
              <div className="leaf-only-notice">
                🍃 Only crop leaf images are accepted. Aadhaar cards, documents, or non-plant photos will be rejected.
              </div>

              {error && (
                <div className={`error-msg ${error.toLowerCase().includes('leaf') || error.toLowerCase().includes('plant') ? 'error-leaf' : ''}`}>
                  {error.toLowerCase().includes('leaf') || error.toLowerCase().includes('plant')
                    ? '🚫 ' + error
                    : error}
                </div>
              )}
              <button
                className="btn btn-primary w-full"
                onClick={handleSubmit}
                disabled={loading || !file}
              >
                {loading ? '🔄 ' + T.detecting : '🔍 ' + T.detect}
              </button>
            </div>

            {/* Result Section */}
            <div className="card disease-result">
              <h3>{T.result}</h3>
              {!result && !loading && (
                <div className="result-placeholder">
                  <span>🩺</span>
                  <p>Upload a leaf image to detect disease</p>
                </div>
              )}
              {loading && <div className="spinner" />}
              {result && (
                <>
                  <div className={`disease-badge ${isHealthy ? 'healthy' : 'infected'}`}>
                    {isHealthy ? '✅ Healthy Plant' : '⚠️ Disease Detected'}
                  </div>

                  <div className="result-disease">
                    {result.disease.replace(/_/g, ' ')}
                  </div>

                  {/* Confidence bar */}
                  <div className="conf-label">
                    {T.confidence}: <strong style={{color: confidenceColor(result.confidence)}}>
                      {(result.confidence * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="conf-bar-bg">
                    <div
                      className="conf-bar-fill"
                      style={{
                        width: `${result.confidence * 100}%`,
                        background: confidenceColor(result.confidence)
                      }}
                    />
                  </div>

                  {/* Treatment */}
                  <div className="treatment-box">
                    <div className="treat-title">💊 {T.treatment}</div>
                    <div className="treat-text">{result.treatment}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="card tip-card">
            <h4>📌 Tips for Best Results</h4>
            <ul>
              <li>Take a clear, well-lit photo of the affected leaf</li>
              <li>Ensure the leaf fills most of the frame</li>
              <li>Avoid blurry or low-resolution images</li>
              <li>Upload one leaf at a time for accurate detection</li>
            </ul>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3 style={{margin:0}}>🕒 Past Scan Results</h3>
            <button className="btn btn-outline" onClick={loadHistory} disabled={hLoading} style={{fontSize:'0.82rem'}}>
              {hLoading ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {hLoading && <div className="spinner" />}

          {!hLoading && history.length === 0 && (
            <div className="result-placeholder">
              <span>📁</span>
              <p>No scans yet. Upload a leaf image to get started.</p>
            </div>
          )}

          {!hLoading && history.length > 0 && (
            <div className="history-list">
              {history.map((item, i) => {
                const diseaseName = (item.predicted_disease || item.disease_name || 'Unknown').replace(/_/g, ' ');
                const healthy = diseaseName.toLowerCase().includes('healthy');
                const conf = typeof item.confidence === 'number' ? item.confidence : 0;
                const confColor = conf > 0.8 ? '#16a34a' : conf > 0.5 ? '#f57c00' : '#c62828';
                return (
                  <div key={item.id || i} className="history-item">
                    <div className="hi-badge-col">
                      <span className={`hi-status-badge ${healthy ? 'hi-healthy' : 'hi-infected'}`}>
                        {healthy ? '✅ Healthy' : '⚠️ Infected'}
                      </span>
                    </div>
                    <div className="hi-main">
                      <div className="hi-disease">{diseaseName}</div>
                      {item.treatment && (
                        <div className="hi-treatment">💊 {item.treatment}</div>
                      )}
                      <div className="hi-meta">🕒 {item.detected_at ? new Date(item.detected_at).toLocaleString('en-IN') : '—'}</div>
                    </div>
                    <div className="hi-conf-col">
                      <div className="hi-conf-num" style={{color: confColor}}>{(conf*100).toFixed(0)}%</div>
                      <div className="hi-conf-label">confidence</div>
                      <div className="hi-conf-bar-bg">
                        <div className="hi-conf-bar-fill" style={{width:`${conf*100}%`, background: confColor}} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
