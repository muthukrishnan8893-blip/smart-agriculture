// pages/NearbyMarketsPage.js
// Uses vanilla Leaflet.js via useRef (no react-leaflet dependency)
import React, { useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './NearbyMarketsPage.css';

const getDistanceBadgeClass = (km) => {
  if (km < 50)  return 'badge-near';
  if (km < 150) return 'badge-mid';
  return 'badge-far';
};

export default function NearbyMarketsPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.nearby || translations.en.nearby;
  const mapRef        = useRef(null);
  const leafletMap    = useRef(null);
  const userMarker    = useRef(null);
  const mandiMarkers  = useRef([]);

  const [userPos,       setUserPos]       = useState(null);
  const [mandis,        setMandis]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [geoError,      setGeoError]      = useState('');
  const [radius,        setRadius]        = useState(300);
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [totalFound,    setTotalFound]    = useState(null);
  const [cityInput,     setCityInput]     = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // â”€â”€ Init Leaflet map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const initMap = useCallback(() => {
    const L = window.L;
    if (!L || !mapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, { center: [20.5937, 78.9629], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(leafletMap.current);
  }, []);

  useEffect(() => {
    if (window.L) { initMap(); return; }
    // Load Leaflet JS from CDN if not already present
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);
    return () => {
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    };
  }, [initMap]);

  // â”€â”€ Update markers when mandis / userPos change â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMap.current) return;
    mandiMarkers.current.forEach(m => m.remove());
    mandiMarkers.current = [];
    if (userMarker.current) { userMarker.current.remove(); userMarker.current = null; }

    if (userPos) {
      const icon = L.divIcon({ className: '', html: '<div class="map-user-pin">ðŸ“</div>', iconSize: [36,36], iconAnchor: [18,36], popupAnchor: [0,-36] });
      userMarker.current = L.marker([userPos.lat, userPos.lng], { icon })
        .addTo(leafletMap.current)
        .bindPopup(`<strong>Your Location</strong><br/>${userPos.lat.toFixed(4)}N, ${userPos.lng.toFixed(4)}E`);
      leafletMap.current.setView([userPos.lat, userPos.lng], 8, { animate: true });
    }

    mandis.forEach(m => {
      const icon = L.divIcon({ className: '', html: '<div class="map-mandi-pin">ðŸª</div>', iconSize: [32,32], iconAnchor: [16,32], popupAnchor: [0,-32] });
      const badge = getDistanceBadgeClass(m.distance_km);
      // Build price rows for popup (top 3)
      const topPrices = (m.prices || []).filter(p => p.price).slice(0, 3);
      const priceRows = topPrices.map(p =>
        `<tr><td>${p.crop}</td><td><strong>₹${p.price.toLocaleString('en-IN')}</strong></td><td class="popup-src-${p.source}">${p.source === 'live' ? '🟢 Live' : '📊 Typical'}</td></tr>`
      ).join('');
      const priceTable = topPrices.length
        ? `<table class="popup-price-table"><thead><tr><th>Crop</th><th>₹/Quintal</th><th></th></tr></thead><tbody>${priceRows}</tbody></table>`
        : '';
      const marker = L.marker([m.lat, m.lng], { icon })
        .addTo(leafletMap.current)
        .bindPopup(`<div class="map-popup">
          <strong>${m.name}</strong><br/>
          <span>📍 ${m.city}, ${m.state}</span><br/>
          <span>🕐 ${m.timings}</span>
          ${priceTable}
          <span class="popup-dist ${badge}">📏 ${m.distance_km} km away</span>
        </div>`, { maxWidth: 260 });
      mandiMarkers.current.push(marker);
    });
  }, [mandis, userPos]);

  // â”€â”€ Pan to selected mandi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!selectedMandi || !leafletMap.current) return;
    leafletMap.current.setView([selectedMandi.lat, selectedMandi.lng], 12, { animate: true });
    mandiMarkers.current.forEach(marker => {
      const ll = marker.getLatLng();
      if (Math.abs(ll.lat - selectedMandi.lat) < 0.001 && Math.abs(ll.lng - selectedMandi.lng) < 0.001)
        marker.openPopup();
    });
  }, [selectedMandi]);

  // â”€â”€ Fetch mandis from backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchMandis = useCallback(async (lat, lng, r) => {
    setLoading(true);
    setGeoError('');
    try {
      const res = await api.get('/market/nearby', { params: { lat, lng, radius: r, limit: 25 } });
      setMandis(res.data.mandis || []);
      setTotalFound(res.data.total_found ?? 0);
    } catch (err) {
      setGeoError(err.response?.data?.error || 'Failed to fetch nearby mandis.');
    } finally {
      setLoading(false);
    }
  }, []);

  // â”€â”€ GPS locate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleLocate = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported by your browser.'); return; }
    setLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setUserPos({ lat, lng });
        fetchMandis(lat, lng, radius);
      },
      (err) => {
        setLoading(false);
        setGeoError(
          err.code === 1
            ? 'Location access denied. Please allow location or use city search below.'
            : 'GPS unavailable. Please use the city/pincode search below.'
        );
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // â”€â”€ City / Pincode search via Nominatim (free, no API key) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCitySearch = async (e) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setSearchLoading(true);
    setGeoError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput + ', India')}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (!data.length) {
        setGeoError(`Location "${cityInput}" not found. Try a nearby city or district name.`);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setUserPos({ lat, lng });
      fetchMandis(lat, lng, radius);
    } catch {
      setGeoError('City search failed. Check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRadiusChange = (e) => {
    const r = Number(e.target.value);
    setRadius(r);
    if (userPos) fetchMandis(userPos.lat, userPos.lng, r);
  };

  const isLocating = loading || searchLoading;

  return (
    <div className="nearby-page">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="nearby-header">
        <div>
          <h1>{T.title}</h1>
          <p>{T.subtitle}</p>
        </div>
        <div className="nearby-controls">
          <label>
            {T.radius}
            <select value={radius} onChange={handleRadiusChange}>
              <option value={100}>100 km</option>
              <option value={200}>200 km</option>
              <option value={300}>300 km</option>
              <option value={500}>500 km</option>
              <option value={1000}>1000 km</option>
            </select>
          </label>
          <button className="btn-locate" onClick={handleLocate} disabled={isLocating}>
            {loading ? 'â³ Locatingâ€¦' : 'ðŸ“¡ Use My GPS'}
          </button>
        </div>
      </div>

      {/* â”€â”€ City search bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <form className="city-search-bar" onSubmit={handleCitySearch}>
        <span className="city-search-icon">ðŸ”</span>
        <input
          type="text"
          placeholder={T.searchPlaceholder}
          value={cityInput}
          onChange={e => setCityInput(e.target.value)}
          disabled={isLocating}
        />
        <button type="submit" disabled={isLocating || !cityInput.trim()}>
          {searchLoading ? 'Searchingâ€¦' : 'Search'}
        </button>
      </form>

      {geoError && <div className="nearby-error">âš ï¸ {geoError}</div>}

      {totalFound !== null && !isLocating && (
        <div className="nearby-summary">
          {T.showing} <strong>{mandis.length}</strong> {T.nearest}
          {totalFound > mandis.length && ` (${totalFound} found within ${radius} km)`}
          {userPos && (
            <span className="user-coords">
              &nbsp;Â· {userPos.lat.toFixed(4)}N, {userPos.lng.toFixed(4)}E
            </span>
          )}
        </div>
      )}

      {/* â”€â”€ Main layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="nearby-main">
        <div className="nearby-map-wrap">
          <div ref={mapRef} className="nearby-map" />
          {!isLocating && totalFound === 0 && (
            <div className="map-no-results">No mandis found within {radius} km. Try increasing the radius.</div>
          )}
        </div>

        <div className="nearby-list">
          {mandis.length === 0 && !isLocating && totalFound === null && (
            <div className="list-placeholder">
              <div className="placeholder-icon">ðŸ—ºï¸</div>
              <p>Use <strong>GPS</strong> or <strong>search your city</strong> to find mandis near you</p>
            </div>
          )}
          {isLocating && (
            <div className="list-placeholder">
              <div className="placeholder-icon spin">â³</div>
              <p>Finding nearby mandisâ€¦</p>
            </div>
          )}
          {mandis.map((m, i) => (
            <div
              key={i}
              className={`mandi-card ${selectedMandi?.name === m.name ? 'selected' : ''}`}
              onClick={() => setSelectedMandi(m)}
            >
              <div className="mandi-card-top">
                <div className="mandi-rank">#{i + 1}</div>
                <div className="mandi-info">
                  <div className="mandi-name">{m.name}</div>
                  <div className="mandi-location">ðŸ“ {m.city}, {m.state}</div>
                </div>
                <div className={`mandi-dist ${getDistanceBadgeClass(m.distance_km)}`}>{m.distance_km} km</div>
              </div>
              <div className="mandi-card-body">
                <span>ðŸŒ¾ {m.crops}</span>
                <span>ðŸ• {m.timings}</span>
              </div>
              {/* Price table */}
              {m.prices && m.prices.some(p => p.price) && (
                <div className="mandi-prices">
                  <div className="mandi-prices-title">{T.prices}</div>
                  <table className="price-table">
                    <thead>
                      <tr><th>Crop</th><th>Price</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {m.prices.filter(p => p.price).map((p, pi) => (
                        <tr key={pi}>
                          <td>{p.crop}</td>
                          <td className="price-value">₹{p.price.toLocaleString('en-IN')}</td>
                          <td>
                            {p.source === 'live'
                              ? <span className="tag-live">🟢 Live</span>
                              : <span className="tag-typical">📊 Typical</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {m.prices.some(p => p.source === 'live' && p.date) && (
                    <div className="price-date">
                      Last updated: {m.prices.find(p => p.source === 'live')?.date}
                    </div>
                  )}
                </div>
              )}
              <div className="mandi-card-footer">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name + ' ' + m.city)}`}
                   target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  ðŸ—ºï¸ Open in Google Maps
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                   target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  ðŸ§­ Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
