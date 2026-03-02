// pages/WeatherPage.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import './WeatherPage.css';

const WEATHER_ICONS = {
  '01d':'☀️','01n':'🌙','02d':'⛅','02n':'⛅',
  '03d':'☁️','03n':'☁️','04d':'☁️','04n':'☁️',
  '09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌦️',
  '11d':'⛈️','11n':'⛈️','13d':'🌨️','13n':'🌨️',
  '50d':'🌫️','50n':'🌫️'
};

// Dynamic background per weather condition
const BG_GRADIENTS = {
  '01d': 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  '01n': 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)',
  '02d': 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)',
  '02n': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  '03d': 'linear-gradient(135deg, #4a6fa5 0%, #90aac9 100%)',
  '04d': 'linear-gradient(135deg, #636e72 0%, #b2bec3 100%)',
  '09d': 'linear-gradient(135deg, #1d6a9e 0%, #4fc3f7 100%)',
  '10d': 'linear-gradient(135deg, #0d6e9c 0%, #56b4d3 100%)',
  '11d': 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
  '50d': 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)',
};

function getAdvisory(weather) {
  const advisories = [];
  const temp = weather.temperature;
  const humidity = weather.humidity;
  const wind = weather.wind_speed;
  const rain = weather.rain_1h || 0;
  const icon = weather.icon || '';

  if (rain > 0 || icon.startsWith('09') || icon.startsWith('10')) {
    advisories.push('🌧️ Rain expected — avoid spraying pesticides or fertilizers today.');
    advisories.push('💧 Good day for transplanting seedlings after rainfall.');
  }
  if (icon.startsWith('11')) {
    advisories.push('⛈️ Thunderstorm alert — keep livestock sheltered and avoid fieldwork.');
  }
  if (temp > 35) {
    advisories.push('🥵 Very hot day — irrigate early morning or evening to reduce evaporation.');
    advisories.push('🌿 Mulch crops to retain soil moisture in high heat.');
  } else if (temp > 28) {
    advisories.push('☀️ Warm day — good for harvesting and drying grain.');
  } else if (temp < 15) {
    advisories.push('🥶 Cool temperatures — protect frost-sensitive crops with covers.');
  }
  if (humidity > 80) {
    advisories.push('💦 High humidity — watch for fungal diseases on crops.');
  } else if (humidity < 40) {
    advisories.push('🌵 Low humidity — increase irrigation frequency.');
  }
  if (wind > 6) {
    advisories.push('💨 Strong winds — hold off on spraying; support tall plants.');
  }
  if (icon.startsWith('01') || icon.startsWith('02')) {
    advisories.push('✅ Clear sky — ideal day for field scouting and crop inspection.');
  }
  if (advisories.length === 0) {
    advisories.push('✅ Normal conditions — routine agricultural activities are fine today.');
  }
  return advisories;
}

function getVisibilityLabel(visibility) {
  if (visibility >= 10000) return { label: 'Excellent', color: '#27ae60' };
  if (visibility >= 7000)  return { label: 'Good',      color: '#2ecc71' };
  if (visibility >= 4000)  return { label: 'Moderate',  color: '#f39c12' };
  if (visibility >= 2000)  return { label: 'Poor',      color: '#e67e22' };
  return                          { label: 'Very Poor', color: '#e74c3c' };
}

export default function WeatherPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.weather || translations.en.weather;

  const [city, setCity]             = useState('');
  const [current, setCurrent]       = useState(null);
  const [forecast, setForecast]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError]           = useState('');
  const [now, setNow]               = useState(new Date());

  // Live clock — update every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const fetchByCity = async (cityName) => {
    if (!cityName.trim()) return;
    setLoading(true); setError('');
    try {
      const [curr, fore] = await Promise.all([
        api.get(`/weather/current?city=${cityName}`),
        api.get(`/weather/forecast?city=${cityName}`)
      ]);
      setCurrent(curr.data.weather);
      setForecast(fore.data.forecast || []);
    } catch (err) {
      setError(err.response?.data?.error || T.searchError || 'Could not fetch weather.');
      setCurrent(null); setForecast([]);
    } finally { setLoading(false); }
  };

  const fetchByCoords = async (lat, lon) => {
    setLocLoading(true); setError('');
    try {
      const [curr, fore] = await Promise.all([
        api.get(`/weather/current?lat=${lat}&lon=${lon}`),
        api.get(`/weather/forecast?lat=${lat}&lon=${lon}`)
      ]);
      setCurrent(curr.data.weather);
      setForecast(fore.data.forecast || []);
      setCity(curr.data.weather?.city || '');
    } catch {
      setError('Could not fetch weather for your location.');
    } finally { setLocLoading(false); }
  };

  const handleSearch = e => { e.preventDefault(); fetchByCity(city); };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
      ()  => setError('Unable to retrieve your location.')
    );
  };

  const formatDate = dateStr => new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  const todayLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const heroBg    = current ? (BG_GRADIENTS[current.icon] || BG_GRADIENTS['02d']) : null;
  const advisory  = current ? getAdvisory(current) : [];
  const visInfo   = current ? getVisibilityLabel(current.visibility || 0) : null;

  return (
    <div className="weather-wrapper">
      {/* Header */}
      <div className="weather-header-row">
        <h2 className="page-title">🌿 Weather Forecast</h2>
        <div className="weather-datetime">
          <span className="wd-date">{todayLabel}</span>
          <span className="wd-time">{timeLabel}</span>
        </div>
      </div>

      {/* Search Bar */}
      <form className="weather-search-bar card" onSubmit={handleSearch}>
        <input
          className="wsb-input"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Enter city (e.g. Pune, Chennai, Delhi)..."
        />
        <button type="submit" className="btn btn-primary wsb-btn" disabled={loading}>
          {loading ? '⏳ Loading...' : '🔍 Search'}
        </button>
        <button
          type="button"
          className="btn wsb-loc-btn"
          onClick={handleGeolocate}
          disabled={locLoading}
          title="Use my location"
        >
          {locLoading ? '⏳' : '📍 My Location'}
        </button>
      </form>

      {error && <div className="weather-error">{error}</div>}

      {/* Empty State */}
      {!current && !loading && !locLoading && (
        <div className="weather-empty card">
          <div className="we-icon">🌾</div>
          <p className="we-title">Check Today's Weather</p>
          <p className="we-sub">Search for a city or tap "My Location" to get real-time weather and farming advisories.</p>
        </div>
      )}

      {current && (
        <>
          {/* TODAY HERO */}
          <div className="today-hero" style={{ background: heroBg }}>
            <div className="today-badge">TODAY</div>
            <div className="today-left">
              <div className="today-city">📍 {current.city}{current.country ? `, ${current.country}` : ''}</div>
              <div className="today-temp">
                {Math.round(current.temperature)}<span className="today-unit">°C</span>
              </div>
              <div className="today-desc">{current.description}</div>
              <div className="today-feels">Feels like {Math.round(current.feels_like)}°C</div>
              {current.mock && <div className="today-mock-badge">Demo Data</div>}
            </div>
            <div className="today-right">
              <div className="today-big-icon">{WEATHER_ICONS[current.icon] || '🌤️'}</div>
            </div>
          </div>

          {/* DETAIL CHIPS */}
          <div className="detail-chips-row">
            {[
              { icon: '💧', val: `${current.humidity}%`,             label: 'Humidity' },
              { icon: '💨', val: `${current.wind_speed} m/s`,        label: 'Wind Speed' },
              { icon: '📊', val: `${current.pressure} hPa`,          label: 'Pressure' },
              { icon: '🌧️', val: `${current.rain_1h ?? 0} mm`,       label: 'Rain (1h)' },
              { icon: '👁️', val: visInfo?.label, color: visInfo?.color, label: 'Visibility' },
              { icon: '🌡️', val: `${Math.round(current.feels_like)}°C`, label: 'Feels Like' },
            ].map((chip, i) => (
              <div key={i} className="detail-chip card">
                <div className="dc-icon">{chip.icon}</div>
                <div className="dc-val" style={chip.color ? { color: chip.color } : {}}>
                  {chip.val}
                </div>
                <div className="dc-label">{chip.label}</div>
              </div>
            ))}
          </div>

          {/* FARMING ADVISORY */}
          <div className="farming-advisory card">
            <h3 className="fa-title">🌾 Today's Farming Advisory</h3>
            <ul className="fa-list">
              {advisory.map((tip, i) => (
                <li key={i} className="fa-item">{tip}</li>
              ))}
            </ul>
          </div>

          {/* 7-DAY FORECAST */}
          {forecast.length > 0 && (
            <div className="forecast-section">
              <h3 className="forecast-title">📅 7-Day Forecast</h3>
              <div className="forecast-scroll">
                {forecast.map((day, i) => (
                  <div key={i} className={`forecast-card card${i === 0 ? ' forecast-today' : ''}`}>
                    <div className="fc-day">{i === 0 ? 'Today' : formatDate(day.date)}</div>
                    <div className="fc-big-icon">{WEATHER_ICONS[day.icon] || '🌤️'}</div>
                    <div className="fc-temps">
                      <span className="fc-max">{Math.round(day.max_temp)}°</span>
                      <span className="fc-min"> / {Math.round(day.min_temp)}°</span>
                    </div>
                    <div className="fc-desc">{day.description}</div>
                    {day.rain > 0 && <div className="fc-rain">🌧️ {day.rain.toFixed(1)} mm</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
