// pages/WeatherPage.js
import React, { useState } from 'react';
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

export default function WeatherPage() {
  const { lang } = useLanguage();
  const T = translations[lang]?.weather || translations.en.weather;
  const [city, setCity]         = useState('');
  const [current, setCurrent]   = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchWeather = async e => {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    try {
      const [curr, fore] = await Promise.all([
        api.get(`/weather/current?city=${city}`),
        api.get(`/weather/forecast?city=${city}`)
      ]);
      setCurrent(curr.data.weather);
      setForecast(fore.data.forecast || []);
    } catch (err) {
      setError(err.response?.data?.error || T.searchError);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="page-wrapper">
      <h2 className="page-title">{T.title}</h2>

      {/* Search */}
      <form className="weather-search card" onSubmit={fetchWeather}>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder={T.placeholder}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? T.loading : T.searchBtn}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {current && (
        <>
          {/* Current weather */}
          <div className="current-weather card">
            <div className="cw-left">
              <div className="cw-city">{current.city}, {current.country}</div>
              <div className="cw-temp">{Math.round(current.temperature)}°C</div>
              <div className="cw-desc">{current.description}</div>
              <div className="cw-feels">{T.feelsLike} {Math.round(current.feels_like)}°C</div>
            </div>
            <div className="cw-right">
              <span className="cw-icon">
                {WEATHER_ICONS[current.icon] || '🌤️'}
              </span>
              <div className="cw-stats">
                <div>💧 <strong>{current.humidity}%</strong> Humidity</div>
                <div>💨 <strong>{current.wind_speed} m/s</strong> Wind</div>
                <div>🌧️ <strong>{current.rain_1h} mm</strong> Rain (1h)</div>
                <div>📊 <strong>{current.pressure} hPa</strong> Pressure</div>
              </div>
            </div>
          </div>

          {/* 7-day forecast */}
          {forecast.length > 0 && (
            <div className="forecast-section">
              <h3>📅 7-Day Forecast</h3>
              <div className="forecast-grid">
                {forecast.map((day, i) => (
                  <div key={i} className="forecast-card card">
                    <div className="fc-date">{formatDate(day.date)}</div>
                    <div className="fc-icon">{WEATHER_ICONS[day.icon] || '🌤️'}</div>
                    <div className="fc-temp">
                      <span className="fc-max">{Math.round(day.max_temp)}°</span>
                      <span className="fc-min"> / {Math.round(day.min_temp)}°</span>
                    </div>
                    <div className="fc-rain">🌧️ {day.rain.toFixed(1)} mm</div>
                    <div className="fc-desc">{day.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!current && !loading && (
        <div className="weather-placeholder card">
          <span>🌏</span>
          <p>{T.enterCity}</p>
        </div>
      )}
    </div>
  );
}
