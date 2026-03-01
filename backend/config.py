"""
config.py - Application Configuration
Smart Agriculture Advisory Platform
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class Config:
    # ── Security ─────────────────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agri_secret_key_change_in_production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_agri_secret_change_in_production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # ── Database (SQLite for dev, MySQL for production) ─────────
    _base_dir = os.path.dirname(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(_base_dir, 'smart_agri.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── OpenWeather API ───────────────────────────────────────
    OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'YOUR_API_KEY_HERE')
    OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

    # ── File Upload ───────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

    # ── ML Model Paths ────────────────────────────────────────
    DISEASE_MODEL_PATH = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'ml_models', 'disease_model.h5'
    )
    PRICE_MODEL_PATH = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'ml_models', 'price_model.pkl'
    )


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
