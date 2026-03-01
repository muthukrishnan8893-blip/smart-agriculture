"""
app.py - Flask Application Factory
Smart Agriculture Advisory Platform
"""

from flask import Flask
from flask_cors import CORS
import os

from backend.extensions import db, jwt, bcrypt


def create_app(config_name='default'):
    """Application factory - creates and configures the Flask app."""
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'),
        template_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
    )

    # ── Load config ───────────────────────────────────────────
    from backend.config import config
    app.config.from_object(config[config_name])

    # ── Ensure upload folder exists ───────────────────────────
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Init extensions ───────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

    # ── Register Blueprints ───────────────────────────────────
    from backend.routes.auth import auth_bp
    from backend.routes.weather import weather_bp
    from backend.routes.fertilizer import fertilizer_bp
    from backend.routes.market import market_bp
    from backend.routes.disease import disease_bp
    from backend.routes.schemes import schemes_bp
    from backend.routes.admin import admin_bp
    from backend.routes.sms import sms_bp

    app.register_blueprint(auth_bp,       url_prefix='/api/auth')
    app.register_blueprint(weather_bp,    url_prefix='/api/weather')
    app.register_blueprint(fertilizer_bp, url_prefix='/api/fertilizer')
    app.register_blueprint(market_bp,     url_prefix='/api/market')
    app.register_blueprint(disease_bp,    url_prefix='/api/disease')
    app.register_blueprint(schemes_bp,    url_prefix='/api/schemes')
    app.register_blueprint(admin_bp,      url_prefix='/api/admin')
    app.register_blueprint(sms_bp,        url_prefix='/api/sms')

    # ── Health check route ────────────────────────────────────
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'Smart Agri API is running'}, 200

    return app
