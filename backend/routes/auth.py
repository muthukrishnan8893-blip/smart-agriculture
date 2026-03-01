"""
routes/auth.py - User Authentication Routes
Handles: Register, Login, Logout, Profile
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from backend.extensions import db, bcrypt
from backend.models.db_models import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new farmer account."""
    data = request.get_json()

    # Validate required fields
    required = ['full_name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Check duplicate email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409

    # Hash password
    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    user = User(
        full_name=data['full_name'],
        email=data['email'],
        phone=data.get('phone'),
        password_hash=password_hash,
        state=data.get('state'),
        district=data.get('district'),
        crop_type=data.get('crop_type'),
        role='farmer'
    )
    db.session.add(user)
    db.session.commit()

    # Issue JWT token
    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({'message': 'Registration successful', 'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password, returns JWT token."""
    data = request.get_json()

    if not data.get('email') and not data.get('phone'):
        return jsonify({'error': 'Email or phone number is required'}), 400
    if not data.get('password'):
        return jsonify({'error': 'Password is required'}), 400

    user = User.query.filter_by(email=data['email']).first() if data.get('email') \
        else User.query.filter_by(phone=data.get('phone')).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({'message': 'Login successful', 'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get logged-in user's profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile details."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    user.full_name = data.get('full_name', user.full_name)
    user.phone     = data.get('phone', user.phone)
    user.state     = data.get('state', user.state)
    user.district  = data.get('district', user.district)
    user.crop_type = data.get('crop_type', user.crop_type)

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change user password after verifying current password."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    current_pw  = data.get('current_password')
    new_pw      = data.get('new_password')

    if not current_pw or not new_pw:
        return jsonify({'error': 'current_password and new_password are required'}), 400

    if not bcrypt.check_password_hash(user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 401

    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    user.password_hash = bcrypt.generate_password_hash(new_pw).decode('utf-8')
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200
