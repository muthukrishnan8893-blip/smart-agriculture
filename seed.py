"""
seed.py - Populate the database with sample data
Run once after first launch: python seed.py
"""

from run import app
from backend.extensions import db
from backend.models.db_models import (
    FertilizerRecommendation, MarketPrice,
    GovernmentScheme, User
)
from backend.extensions import bcrypt
from datetime import date


def seed():
    with app.app_context():
        db.create_all()

        # ── Admin user ──────────────────────────────────────
        if not User.query.filter_by(email='admin@agri.com').first():
            admin = User(
                full_name='Admin',
                email='admin@agri.com',
                password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                role='admin'
            )
            db.session.add(admin)
            print("✓ Admin user created  →  admin@agri.com / admin123")

        # ── Fertilizer Recommendations ───────────────────────
        if FertilizerRecommendation.query.count() == 0:
            recs = [
                ('Loamy',      'Wheat',     120, 60,  40,  'Urea + DAP',         '50kg Urea + 30kg DAP',       'Apply in two splits – sowing and 30 days after'),
                ('Clayey',     'Rice',      100, 50,  50,  'Urea + MOP',         '45kg Urea + 25kg MOP',       'Flood irrigated; apply urea at transplanting'),
                ('Sandy',      'Maize',      80, 40,  30,  'NPK 10:26:26',       '40kg NPK',                   'Sandy soil drains fast, split application advised'),
                ('Black',      'Cotton',     60, 30,  30,  'DAP + Potash',       '25kg DAP + 20kg Potash',     'Black soil retains moisture well'),
                ('Red',        'Groundnut',  20, 40,  40,  'SSP + MOP',          '50kg SSP + 20kg MOP',        'Low nitrogen for legumes'),
                ('Loamy',      'Tomato',    150, 80,  80,  'NPK 19:19:19',       '60kg NPK',                   'High demand crop; fertigation preferred'),
                ('Loamy',      'Potato',    180, 90, 120,  'Urea + DAP + MOP',   '80kg Urea + 40kg DAP + 60kg MOP', 'Split into 3 doses'),
                ('Alluvial',   'Sugarcane', 250, 80, 100,  'Urea + SSP + MOP',   '100kg Urea + 40kg SSP + 50kg MOP', 'Long duration crop'),
                ('Loamy',      'Soybean',    30, 60,  40,  'DAP',                '50kg DAP',                   'Nitrogen fixed by rhizobium'),
                ('Sandy Loam', 'Onion',     100, 50, 100,  'NPK 15:15:15 + Potash', '50kg NPK + 30kg Potash', 'Potassium important for bulb quality'),
            ]
            for r in recs:
                db.session.add(FertilizerRecommendation(
                    soil_type=r[0], crop_type=r[1], nitrogen=r[2],
                    phosphorus=r[3], potassium=r[4],
                    recommended_fertilizer=r[5], quantity_per_acre=r[6], notes=r[7]
                ))
            print(f"✓ {len(recs)} fertilizer recommendations seeded")

        # ── Market Prices ────────────────────────────────────
        if MarketPrice.query.count() == 0:
            prices = [
                ('Wheat',     'Azadpur Mandi',   'Delhi',           'Delhi',    2100, '2026-02-01'),
                ('Rice',      'Amritsar Mandi',  'Punjab',          'Amritsar', 1900, '2026-02-01'),
                ('Maize',     'Guntur Mandi',    'Andhra Pradesh',  'Guntur',   1650, '2026-02-01'),
                ('Cotton',    'Rajkot Mandi',    'Gujarat',         'Rajkot',   6200, '2026-02-01'),
                ('Groundnut', 'Junagadh Mandi',  'Gujarat',         'Junagadh', 5100, '2026-02-01'),
                ('Tomato',    'Nashik Mandi',    'Maharashtra',     'Nashik',   1200, '2026-02-01'),
                ('Potato',    'Agra Mandi',      'Uttar Pradesh',   'Agra',      900, '2026-02-01'),
                ('Soybean',   'Indore Mandi',    'Madhya Pradesh',  'Indore',   3800, '2026-02-01'),
                ('Onion',     'Lasalgaon Mandi', 'Maharashtra',     'Nashik',   1600, '2026-02-01'),
                ('Sugarcane', 'Kolhapur Mandi',  'Maharashtra',     'Kolhapur',  350, '2026-02-01'),
                ('Wheat',     'Azadpur Mandi',   'Delhi',           'Delhi',    2050, '2026-01-01'),
                ('Rice',      'Amritsar Mandi',  'Punjab',          'Amritsar', 1850, '2026-01-01'),
                ('Tomato',    'Nashik Mandi',    'Maharashtra',     'Nashik',   1400, '2026-01-01'),
                ('Potato',    'Agra Mandi',      'Uttar Pradesh',   'Agra',      850, '2026-01-01'),
                ('Wheat',     'Azadpur Mandi',   'Delhi',           'Delhi',    1980, '2025-12-01'),
                ('Rice',      'Amritsar Mandi',  'Punjab',          'Amritsar', 1800, '2025-12-01'),
                ('Tomato',    'Nashik Mandi',    'Maharashtra',     'Nashik',    900, '2025-12-01'),
                ('Onion',     'Lasalgaon Mandi', 'Maharashtra',     'Nashik',   2100, '2025-12-01'),
            ]
            for p in prices:
                db.session.add(MarketPrice(
                    crop_name=p[0], market_name=p[1], state=p[2],
                    district=p[3], price_per_quintal=p[4],
                    date_recorded=date.fromisoformat(p[5])
                ))
            print(f"✓ {len(prices)} market price records seeded")

        # ── Government Schemes ───────────────────────────────
        if GovernmentScheme.query.count() == 0:
            schemes = [
                ('PM-KISAN Samman Nidhi', 'Direct income support of Rs 6000/year to all farmer families',
                 'All States', 'All', '2026-03-31', 'Rs 6000/year direct bank transfer', 'https://pmkisan.gov.in'),
                ('PM Fasal Bima Yojana', 'Crop insurance scheme for kharif and rabi crops',
                 'All States', 'Wheat,Rice,Cotton,Maize', '2026-07-31', 'Crop loss compensation', 'https://pmfby.gov.in'),
                ('Soil Health Card Scheme', 'Free soil testing and health card for farmers',
                 'All States', 'All', '2026-12-31', 'Free soil nutrient analysis card', 'https://soilhealth.dac.gov.in'),
                ('National Mission on Oilseeds', 'Support for oilseed cultivation',
                 'Gujarat,Rajasthan,Madhya Pradesh', 'Groundnut,Soybean,Mustard', '2026-09-30', 'Subsidy on seeds and equipment', 'https://nmoop.gov.in'),
                ('Per Drop More Crop', 'Micro irrigation subsidy scheme',
                 'Maharashtra,Karnataka,Andhra Pradesh', 'Tomato,Onion,Cotton', '2026-06-30', '55% subsidy on drip/sprinkler irrigation', 'https://pmksy.gov.in'),
                ('Kisan Credit Card', 'Short term credit to farmers at subsidized rates',
                 'All States', 'All', None, 'Credit up to Rs 3 lakh at 4% interest', 'https://kisan.gov.in'),
            ]
            for s in schemes:
                db.session.add(GovernmentScheme(
                    scheme_name=s[0], description=s[1], applicable_states=s[2],
                    applicable_crops=s[3],
                    deadline=date.fromisoformat(s[4]) if s[4] else None,
                    benefit=s[5], apply_link=s[6]
                ))
            print(f"✓ {len(schemes)} government schemes seeded")

        db.session.commit()
        print("\n✅ Database seeded successfully!")
        print("   Login: admin@agri.com / admin123")


if __name__ == '__main__':
    seed()
