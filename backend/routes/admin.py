"""
routes/admin.py - Admin Panel Routes
Admin-only endpoints for managing users, prices, and schemes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from backend.extensions import db, bcrypt
from backend.models.db_models import User, MarketPrice, GovernmentScheme
from datetime import date

admin_bp = Blueprint('admin', __name__)


def admin_required(fn):
    """Decorator: restrict access to admin users only."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ── User Management ───────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """List all registered users."""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a farmer account."""
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'error': 'Cannot delete admin accounts'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user.email} deleted'}), 200


@admin_bp.route('/users/create-admin', methods=['POST'])
@admin_required
def create_admin():
    """Promote or create an admin account."""
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'email and password required'}), 400

    existing = User.query.filter_by(email=data['email']).first()
    if existing:
        existing.role = 'admin'
        db.session.commit()
        return jsonify({'message': f'{data["email"]} promoted to admin'}), 200

    user = User(
        full_name=data.get('full_name', 'Admin'),
        email=data['email'],
        password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        role='admin'
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Admin account created', 'user': user.to_dict()}), 201


# ── Market Price Management ───────────────────────────────────

@admin_bp.route('/prices', methods=['POST'])
@admin_required
def add_price():
    """Add a new market price entry."""
    data = request.get_json()
    required = ['crop_name', 'price_per_quintal', 'date_recorded']
    for f in required:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400

    price = MarketPrice(
        crop_name=data['crop_name'],
        market_name=data.get('market_name'),
        state=data.get('state'),
        district=data.get('district'),
        price_per_quintal=float(data['price_per_quintal']),
        date_recorded=date.fromisoformat(data['date_recorded'])
    )
    db.session.add(price)
    db.session.commit()
    return jsonify({'message': 'Price added', 'price': price.to_dict()}), 201


@admin_bp.route('/prices/<int:price_id>', methods=['DELETE'])
@admin_required
def delete_price(price_id):
    """Delete a market price record."""
    price = MarketPrice.query.get_or_404(price_id)
    db.session.delete(price)
    db.session.commit()
    return jsonify({'message': 'Price record deleted'}), 200


# ── Government Scheme Management ─────────────────────────────

@admin_bp.route('/schemes', methods=['POST'])
@admin_required
def add_scheme():
    """Add a new government scheme."""
    data = request.get_json()
    if not data.get('scheme_name'):
        return jsonify({'error': 'scheme_name is required'}), 400

    scheme = GovernmentScheme(
        scheme_name=data['scheme_name'],
        description=data.get('description'),
        applicable_states=data.get('applicable_states', 'All States'),
        applicable_crops=data.get('applicable_crops', 'All'),
        deadline=date.fromisoformat(data['deadline']) if data.get('deadline') else None,
        benefit=data.get('benefit'),
        apply_link=data.get('apply_link')
    )
    db.session.add(scheme)
    db.session.commit()
    return jsonify({'message': 'Scheme added', 'scheme': scheme.to_dict()}), 201


@admin_bp.route('/schemes/<int:scheme_id>', methods=['PUT'])
@admin_required
def update_scheme(scheme_id):
    """Update an existing government scheme."""
    scheme = GovernmentScheme.query.get_or_404(scheme_id)
    data   = request.get_json()

    scheme.scheme_name       = data.get('scheme_name', scheme.scheme_name)
    scheme.description       = data.get('description', scheme.description)
    scheme.applicable_states = data.get('applicable_states', scheme.applicable_states)
    scheme.applicable_crops  = data.get('applicable_crops', scheme.applicable_crops)
    scheme.benefit           = data.get('benefit', scheme.benefit)
    scheme.apply_link        = data.get('apply_link', scheme.apply_link)
    if data.get('deadline'):
        scheme.deadline = date.fromisoformat(data['deadline'])

    db.session.commit()
    return jsonify({'message': 'Scheme updated', 'scheme': scheme.to_dict()}), 200


@admin_bp.route('/schemes/<int:scheme_id>', methods=['DELETE'])
@admin_required
def delete_scheme(scheme_id):
    """Delete a government scheme."""
    scheme = GovernmentScheme.query.get_or_404(scheme_id)
    db.session.delete(scheme)
    db.session.commit()
    return jsonify({'message': 'Scheme deleted'}), 200


# ── Dashboard Stats ───────────────────────────────────────────

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def dashboard_stats():
    """Return high-level platform statistics for the admin dashboard."""
    total_users   = User.query.filter_by(role='farmer').count()
    total_prices  = MarketPrice.query.count()
    total_schemes = GovernmentScheme.query.count()

    return jsonify({
        'total_farmers': total_users,
        'total_price_records': total_prices,
        'total_schemes': total_schemes
    }), 200
