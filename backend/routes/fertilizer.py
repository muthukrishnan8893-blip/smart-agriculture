"""
routes/fertilizer.py - Soil & Fertilizer Recommendation Routes
Uses rule-based logic + database lookup
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.db_models import FertilizerRecommendation

fertilizer_bp = Blueprint('fertilizer', __name__)


def _npk_deficiency_advice(n, p, k):
    """
    Generate plain-language advice based on NPK values.
    Typical adequate levels: N > 280 kg/ha, P > 12 kg/ha, K > 110 kg/ha
    (scaled: values entered per acre, multiply ×2.47 for per-ha rough estimate)
    """
    advice = []
    if n < 50:
        advice.append("Nitrogen is critically low – apply Urea or Ammonium Sulfate urgently.")
    elif n < 100:
        advice.append("Nitrogen is moderate – supplement with a top-dress of Urea.")

    if p < 20:
        advice.append("Phosphorus is low – apply DAP or Single Super Phosphate (SSP).")

    if k < 20:
        advice.append("Potassium is low – apply Muriate of Potash (MOP).")

    if not advice:
        advice.append("NPK levels appear adequate. Maintain with balanced fertilization.")

    return advice


@fertilizer_bp.route('/recommend', methods=['POST'])
@jwt_required()
def recommend():
    """
    Recommend fertilizer based on soil type, crop, and NPK values.

    Request body (JSON):
    {
        "soil_type": "Loamy",
        "crop_type": "Wheat",
        "nitrogen": 80,
        "phosphorus": 30,
        "potassium": 25
    }
    """
    data = request.get_json()

    if not data.get('soil_type') or not data.get('crop_type'):
        return jsonify({'error': 'soil_type and crop_type are required'}), 400

    # Default NPK based on soil_health level if not explicitly provided
    HEALTH_DEFAULTS = {
        'poor':      (35,  12, 14),
        'low':       (65,  22, 26),
        'average':   (95,  38, 45),
        'good':      (130, 55, 68),
        'excellent': (170, 72, 90),
    }
    soil_health = (data.get('soil_health') or 'average').lower()
    dn, dp, dk  = HEALTH_DEFAULTS.get(soil_health, HEALTH_DEFAULTS['average'])

    soil = data['soil_type'].strip()
    crop = data['crop_type'].strip()
    n    = float(data.get('nitrogen')   or dn)
    p    = float(data.get('phosphorus') or dp)
    k    = float(data.get('potassium')  or dk)

    # 1. Look up exact match in database
    rec = FertilizerRecommendation.query.filter_by(
        soil_type=soil, crop_type=crop
    ).first()

    # 2. Fall back to crop-only match
    if not rec:
        rec = FertilizerRecommendation.query.filter_by(crop_type=crop).first()

    # 3. Build NPK deficiency advice
    npk_advice = _npk_deficiency_advice(n, p, k)

    if rec:
        result = {
            'soil_type':              rec.soil_type,
            'crop_type':              rec.crop_type,
            'soil_health':            soil_health,
            'recommended_fertilizer': rec.recommended_fertilizer,
            'quantity_per_acre':      rec.quantity_per_acre,
            'base_notes':             rec.notes,
            'npk_adjustment_advice':  npk_advice
        }
    else:
        # Generic fallback if no DB match
        result = {
            'soil_type':              soil,
            'crop_type':              crop,
            'soil_health':            soil_health,
            'recommended_fertilizer': 'NPK 10:26:26 or as per soil test report',
            'quantity_per_acre':      '50 kg/acre',
            'base_notes':             'No specific record found. Please consult a local agronomist.',
            'npk_adjustment_advice':  npk_advice
        }

    return jsonify({'recommendation': result}), 200


@fertilizer_bp.route('/soil-types', methods=['GET'])
def get_soil_types():
    """Return distinct soil types available in the database."""
    types = db.session.query(FertilizerRecommendation.soil_type).distinct().all()
    return jsonify({'soil_types': [t[0] for t in types if t[0]]}), 200


@fertilizer_bp.route('/crop-types', methods=['GET'])
def get_crop_types():
    """Return distinct crop types available in the database."""
    types = db.session.query(FertilizerRecommendation.crop_type).distinct().all()
    return jsonify({'crop_types': [t[0] for t in types if t[0]]}), 200
