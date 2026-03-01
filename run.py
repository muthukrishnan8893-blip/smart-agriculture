"""
run.py - Application Entry Point
Smart Agriculture Advisory Platform

Usage:
    python run.py
"""

from backend.app import create_app
from backend.extensions import db

app = create_app('development')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()     # Create tables if they don't exist
        print("[OK] Database tables verified (MySQL)")
    print("[OK] Starting Smart Agriculture Advisory Platform...")
    print("[OK] API running at http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
