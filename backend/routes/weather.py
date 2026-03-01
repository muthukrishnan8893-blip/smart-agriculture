"""
routes/weather.py - Weather Module Routes
Fetches data from OpenWeatherMap API
"""

import requests
import random
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

weather_bp = Blueprint('weather', __name__)


def _get_api_key():
    return current_app.config['OPENWEATHER_API_KEY']


def _base_url():
    return current_app.config['OPENWEATHER_BASE_URL']


def _is_valid_api_key():
    key = _get_api_key()
    return key and key not in ('YOUR_API_KEY_HERE', '', None)


# Realistic mock weather data for Indian cities
CITY_WEATHER = {
    'default':   dict(temp=28, feels=30, humidity=65, pressure=1012, wind=3.5, desc='partly cloudy',     icon='02d', rain=0),
    'pune':      dict(temp=29, feels=31, humidity=58, pressure=1013, wind=2.8, desc='clear sky',         icon='01d', rain=0),
    'amritsar':  dict(temp=18, feels=16, humidity=72, pressure=1015, wind=4.1, desc='mist',              icon='50d', rain=0.2),
    'delhi':     dict(temp=22, feels=20, humidity=68, pressure=1014, wind=5.2, desc='haze',              icon='50d', rain=0),
    'mumbai':    dict(temp=32, feels=36, humidity=80, pressure=1010, wind=3.0, desc='scattered clouds',  icon='03d', rain=0),
    'chennai':   dict(temp=34, feels=38, humidity=75, pressure=1009, wind=4.5, desc='overcast clouds',   icon='04d', rain=0),
    'kolkata':   dict(temp=30, feels=33, humidity=78, pressure=1011, wind=2.5, desc='light rain',        icon='10d', rain=1.2),
    'bangalore': dict(temp=25, feels=26, humidity=62, pressure=1015, wind=3.2, desc='few clouds',        icon='02d', rain=0),
    'hyderabad': dict(temp=30, feels=32, humidity=55, pressure=1012, wind=3.8, desc='clear sky',         icon='01d', rain=0),
    'jaipur':    dict(temp=26, feels=25, humidity=45, pressure=1013, wind=4.0, desc='sunny',             icon='01d', rain=0),
    'lucknow':   dict(temp=24, feels=23, humidity=70, pressure=1014, wind=3.3, desc='broken clouds',     icon='04d', rain=0),
    'bhopal':    dict(temp=27, feels=28, humidity=60, pressure=1013, wind=2.9, desc='partly cloudy',     icon='02d', rain=0),
    'nagpur':    dict(temp=31, feels=34, humidity=50, pressure=1011, wind=3.6, desc='clear sky',         icon='01d', rain=0),
    'surat':     dict(temp=33, feels=37, humidity=77, pressure=1010, wind=4.2, desc='humid',             icon='03d', rain=0),
    'patna':     dict(temp=23, feels=22, humidity=74, pressure=1015, wind=2.7, desc='foggy',             icon='50d', rain=0),
}

FORECAST_DESCS = [
    ('01d', 'clear sky',       0.0),
    ('02d', 'few clouds',      0.0),
    ('03d', 'scattered clouds',0.0),
    ('10d', 'light rain',      2.5),
    ('09d', 'shower rain',     5.0),
    ('04d', 'overcast clouds', 0.0),
]


def _mock_current(city: str) -> dict:
    key = city.lower().split(',')[0].strip()
    w = CITY_WEATHER.get(key, CITY_WEATHER['default']).copy()
    # small random variation each call
    w['temp']     = round(w['temp']     + random.uniform(-1.5, 1.5), 1)
    w['humidity'] = min(99, max(30, w['humidity'] + random.randint(-5, 5)))
    return {
        'city':        city.title(),
        'country':     'IN',
        'temperature': w['temp'],
        'feels_like':  w['feels'],
        'humidity':    w['humidity'],
        'pressure':    w['pressure'],
        'description': w['desc'],
        'icon':        w['icon'],
        'wind_speed':  w['wind'],
        'rain_1h':     w['rain'],
        'visibility':  8000,
        'mock':        True
    }


def _mock_forecast(city: str) -> list:
    from datetime import date, timedelta
    key = city.lower().split(',')[0].strip()
    base = CITY_WEATHER.get(key, CITY_WEATHER['default'])
    forecast = []
    for i in range(7):
        icon, desc, rain = random.choice(FORECAST_DESCS)
        forecast.append({
            'date':        (date.today() + timedelta(days=i)).isoformat(),
            'min_temp':    round(base['temp'] - random.uniform(3, 6), 1),
            'max_temp':    round(base['temp'] + random.uniform(1, 4), 1),
            'humidity':    min(99, base['humidity'] + random.randint(-8, 8)),
            'description': desc,
            'icon':        icon,
            'rain':        rain,
            'wind_speed':  round(base['wind'] + random.uniform(-1, 1), 1),
        })
    return forecast


@weather_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_weather():
    """
    Get current weather for a city.
    Query params: city (string) OR lat & lon (floats)
    """
    city = request.args.get('city')
    lat  = request.args.get('lat')
    lon  = request.args.get('lon')

    if not city and not (lat and lon):
        return jsonify({'error': 'Provide city name or lat/lon coordinates'}), 400

    # ── Mock mode when no valid API key ───────────────────────
    if not _is_valid_api_key():
        city_name = city or 'Your Location'
        return jsonify({'weather': _mock_current(city_name)}), 200

    if city:
        params = {'q': city, 'appid': _get_api_key(), 'units': 'metric'}
    else:
        params = {'lat': lat, 'lon': lon, 'appid': _get_api_key(), 'units': 'metric'}

    try:
        resp = requests.get(f"{_base_url()}/weather", params=params, timeout=10)
        resp.raise_for_status()
        raw = resp.json()

        weather = {
            'city':        raw['name'],
            'country':     raw['sys']['country'],
            'temperature': raw['main']['temp'],
            'feels_like':  raw['main']['feels_like'],
            'humidity':    raw['main']['humidity'],
            'pressure':    raw['main']['pressure'],
            'description': raw['weather'][0]['description'],
            'icon':        raw['weather'][0]['icon'],
            'wind_speed':  raw['wind']['speed'],
            'rain_1h':     raw.get('rain', {}).get('1h', 0),
            'visibility':  raw.get('visibility', 0)
        }
        return jsonify({'weather': weather}), 200

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404
        # Fallback to mock on API error
        return jsonify({'weather': _mock_current(city or 'India')}), 200
    except requests.exceptions.RequestException:
        return jsonify({'weather': _mock_current(city or 'India')}), 200


@weather_bp.route('/forecast', methods=['GET'])
@jwt_required()
def get_forecast():
    """
    Get 7-day forecast (OpenWeather 5-day/3-hour forecast, grouped by day).
    Query params: city OR lat & lon
    """
    city = request.args.get('city')
    lat  = request.args.get('lat')
    lon  = request.args.get('lon')

    if not city and not (lat and lon):
        return jsonify({'error': 'Provide city name or lat/lon coordinates'}), 400

    # ── Mock mode when no valid API key ───────────────────────
    if not _is_valid_api_key():
        city_name = city or 'Your Location'
        return jsonify({'city': city_name.title(), 'forecast': _mock_forecast(city_name)}), 200

    if city:
        params = {'q': city, 'appid': _get_api_key(), 'units': 'metric', 'cnt': 40}
    else:
        params = {'lat': lat, 'lon': lon, 'appid': _get_api_key(), 'units': 'metric', 'cnt': 40}

    try:
        resp = requests.get(f"{_base_url()}/forecast", params=params, timeout=10)
        resp.raise_for_status()
        raw = resp.json()

        # Group forecasts by date and pick noon reading
        from collections import defaultdict
        daily = defaultdict(list)
        for item in raw['list']:
            d = item['dt_txt'].split(' ')[0]
            daily[d].append(item)

        forecast = []
        for d, items in list(daily.items())[:7]:
            midday = next((i for i in items if '12:00:00' in i['dt_txt']), items[0])
            forecast.append({
                'date':        d,
                'min_temp':    min(i['main']['temp_min'] for i in items),
                'max_temp':    max(i['main']['temp_max'] for i in items),
                'humidity':    midday['main']['humidity'],
                'description': midday['weather'][0]['description'],
                'icon':        midday['weather'][0]['icon'],
                'rain':        sum(i.get('rain', {}).get('3h', 0) for i in items),
                'wind_speed':  midday['wind']['speed']
            })

        return jsonify({'city': raw['city']['name'], 'forecast': forecast}), 200

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': 'City not found'}), 404
        return jsonify({'city': city or 'India', 'forecast': _mock_forecast(city or 'India')}), 200
    except requests.exceptions.RequestException:
        return jsonify({'city': city or 'India', 'forecast': _mock_forecast(city or 'India')}), 200
