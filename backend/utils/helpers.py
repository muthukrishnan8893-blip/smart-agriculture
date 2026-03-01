"""
utils/helpers.py - Shared utility functions
Smart Agriculture Advisory Platform
"""

import os
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def allowed_file(filename, allowed={'png', 'jpg', 'jpeg', 'gif', 'bmp'}):
    """Return True if filename has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


def paginate_query(query, page=1, per_page=20):
    """Return a paginated slice from a SQLAlchemy query."""
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }
