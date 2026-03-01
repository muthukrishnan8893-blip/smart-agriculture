"""
routes/schemes.py - Government Scheme Notification Routes
Supports filtering by state, crop, and deadline alerts
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.db_models import GovernmentScheme
from datetime import date, timedelta

schemes_bp = Blueprint('schemes', __name__)


@schemes_bp.route('/', methods=['GET'])
@jwt_required()
def get_schemes():
    """
    Get government schemes, optionally filtered by state and crop.
    Query params: state, crop
    Optional flag: deadline_soon=true (deadlines within 30 days)
    """
    state         = request.args.get('state', '')
    crop          = request.args.get('crop', '')
    deadline_soon = request.args.get('deadline_soon', 'false').lower() == 'true'

    schemes = GovernmentScheme.query.all()

    # Filter by state (state = 'All States' means applicable everywhere)
    if state:
        schemes = [
            s for s in schemes
            if 'All States' in (s.applicable_states or '') or
               state.lower() in (s.applicable_states or '').lower()
        ]

    # Filter by crop
    if crop:
        schemes = [
            s for s in schemes
            if 'All' in (s.applicable_crops or '') or
               crop.lower() in (s.applicable_crops or '').lower()
        ]

    # Filter for upcoming deadlines
    if deadline_soon:
        today    = date.today()
        in_30    = today + timedelta(days=30)
        schemes = [
            s for s in schemes
            if s.deadline and today <= s.deadline <= in_30
        ]

    # Add deadline_alert flag
    today = date.today()
    result = []
    for s in schemes:
        d = s.to_dict()
        d['deadline_alert'] = (
            bool(s.deadline and today <= s.deadline <= today + timedelta(days=30))
        )
        result.append(d)

    return jsonify({'schemes': result}), 200


@schemes_bp.route('/<int:scheme_id>', methods=['GET'])
@jwt_required()
def get_scheme_detail(scheme_id):
    """Get full details for a single scheme."""
    scheme = GovernmentScheme.query.get_or_404(scheme_id)
    return jsonify({'scheme': scheme.to_dict()}), 200
