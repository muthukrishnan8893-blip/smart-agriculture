"""
models/db_models.py - SQLAlchemy ORM Models
Smart Agriculture Advisory Platform
"""

from backend.extensions import db
from datetime import datetime


class User(db.Model):
    """Farmer / Admin user account."""
    __tablename__ = 'users'

    id           = db.Column(db.Integer, primary_key=True)
    full_name    = db.Column(db.String(100), nullable=False)
    email        = db.Column(db.String(100), unique=True, nullable=False)
    phone        = db.Column(db.String(15))
    password_hash = db.Column(db.String(255), nullable=False)
    state        = db.Column(db.String(50))
    district     = db.Column(db.String(50))
    crop_type    = db.Column(db.String(50))
    role         = db.Column(db.Enum('farmer', 'admin'), default='farmer')
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    detections   = db.relationship('DiseaseDetection', backref='user', lazy=True)
    predictions  = db.relationship('PricePrediction',  backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'state': self.state,
            'district': self.district,
            'crop_type': self.crop_type,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }


class FertilizerRecommendation(db.Model):
    """Rule-based fertilizer recommendation lookup table."""
    __tablename__ = 'fertilizer_recommendations'

    id                     = db.Column(db.Integer, primary_key=True)
    soil_type              = db.Column(db.String(50))
    crop_type              = db.Column(db.String(50))
    nitrogen               = db.Column(db.Float)
    phosphorus             = db.Column(db.Float)
    potassium              = db.Column(db.Float)
    recommended_fertilizer = db.Column(db.String(100))
    quantity_per_acre      = db.Column(db.String(50))
    notes                  = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'soil_type': self.soil_type,
            'crop_type': self.crop_type,
            'nitrogen': self.nitrogen,
            'phosphorus': self.phosphorus,
            'potassium': self.potassium,
            'recommended_fertilizer': self.recommended_fertilizer,
            'quantity_per_acre': self.quantity_per_acre,
            'notes': self.notes
        }


class MarketPrice(db.Model):
    """Historical and current crop market prices."""
    __tablename__ = 'market_prices'

    id                = db.Column(db.Integer, primary_key=True)
    crop_name         = db.Column(db.String(100), nullable=False)
    market_name       = db.Column(db.String(100))
    state             = db.Column(db.String(50))
    district          = db.Column(db.String(50))
    price_per_quintal = db.Column(db.Float, nullable=False)
    date_recorded     = db.Column(db.Date, nullable=False)
    created_at        = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_name': self.crop_name,
            'market_name': self.market_name,
            'state': self.state,
            'district': self.district,
            'price_per_quintal': self.price_per_quintal,
            'date_recorded': self.date_recorded.isoformat()
        }


class GovernmentScheme(db.Model):
    """Government welfare and subsidy schemes for farmers."""
    __tablename__ = 'government_schemes'

    id                 = db.Column(db.Integer, primary_key=True)
    scheme_name        = db.Column(db.String(200), nullable=False)
    description        = db.Column(db.Text)
    applicable_states  = db.Column(db.Text)   # comma-separated
    applicable_crops   = db.Column(db.Text)   # comma-separated
    deadline           = db.Column(db.Date)
    benefit            = db.Column(db.String(200))
    apply_link         = db.Column(db.String(300))
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'scheme_name': self.scheme_name,
            'description': self.description,
            'applicable_states': self.applicable_states,
            'applicable_crops': self.applicable_crops,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'benefit': self.benefit,
            'apply_link': self.apply_link
        }


class DiseaseDetection(db.Model):
    """Log of crop disease detection requests."""
    __tablename__ = 'disease_detections'

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    image_path        = db.Column(db.String(300))
    predicted_disease = db.Column(db.String(100))
    confidence        = db.Column(db.Float)
    treatment         = db.Column(db.Text)
    detected_at       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'predicted_disease': self.predicted_disease,
            'confidence': self.confidence,
            'treatment': self.treatment,
            'detected_at': self.detected_at.isoformat()
        }


class PricePrediction(db.Model):
    """Log of ML-based crop price predictions."""
    __tablename__ = 'price_predictions'

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    crop_name        = db.Column(db.String(100))
    state            = db.Column(db.String(50))
    predicted_price  = db.Column(db.Float)
    prediction_date  = db.Column(db.Date)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_name': self.crop_name,
            'state': self.state,
            'predicted_price': self.predicted_price,
            'prediction_date': self.prediction_date.isoformat() if self.prediction_date else None
        }
