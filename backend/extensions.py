# backend/extensions.py - Shared extension instances
# Avoids circular imports by keeping extensions separate from app factory

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
