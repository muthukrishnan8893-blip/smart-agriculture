"""
ml_models/train_price_model.py
Train a Random Forest Regression model for crop price prediction.

Run: python ml_models/train_price_model.py
Output: ml_models/price_model.pkl
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

# ── Sample training data ──────────────────────────────────────
# Columns: crop_code, months_ahead, price_per_quintal
# crop_code: 1=Wheat, 2=Rice, 3=Maize, 4=Cotton, 5=Groundnut,
#            6=Tomato, 7=Potato, 8=Soybean, 9=Onion, 10=Sugarcane

DATA = [
    # crop_code, months_ahead, price
    (1, 0, 1980), (1, 1, 2000), (1, 2, 2020), (1, 3, 2050),
    (1, 4, 2080), (1, 5, 2100), (1, 6, 2130),
    (2, 0, 1800), (2, 1, 1820), (2, 2, 1840), (2, 3, 1870),
    (2, 4, 1900), (2, 5, 1920), (2, 6, 1950),
    (3, 0, 1600), (3, 1, 1630), (3, 2, 1650), (3, 3, 1680),
    (3, 4, 1700), (3, 5, 1720), (3, 6, 1750),
    (4, 0, 6000), (4, 1, 6050), (4, 2, 6100), (4, 3, 6200),
    (4, 4, 6250), (4, 5, 6300), (4, 6, 6350),
    (5, 0, 5000), (5, 1, 5050), (5, 2, 5080), (5, 3, 5100),
    (5, 4, 5150), (5, 5, 5200), (5, 6, 5250),
    (6, 0,  900), (6, 1, 1000), (6, 2, 1100), (6, 3, 1200),
    (6, 4, 1100), (6, 5,  950), (6, 6,  900),  # seasonal crop – price fluctuates
    (7, 0,  850), (7, 1,  870), (7, 2,  900), (7, 3,  920),
    (7, 4,  900), (7, 5,  870), (7, 6,  850),
    (8, 0, 3700), (8, 1, 3750), (8, 2, 3780), (8, 3, 3800),
    (8, 4, 3820), (8, 5, 3850), (8, 6, 3880),
    (9, 0, 1600), (9, 1, 1700), (9, 2, 1800), (9, 3, 2000),
    (9, 4, 1800), (9, 5, 1600), (9, 6, 1500),  # onion seasonal
    (10, 0, 340), (10, 1, 345), (10, 2, 350), (10, 3, 355),
    (10, 4, 360), (10, 5, 365), (10, 6, 370),
]

# Add some noise to make training data more realistic
np.random.seed(42)
rows = []
for crop_code, months_ahead, base_price in DATA:
    for _ in range(10):   # 10 variations per data point
        noise = np.random.normal(0, base_price * 0.03)
        rows.append([crop_code, months_ahead, base_price + noise])

df = pd.DataFrame(rows, columns=['crop_code', 'months_ahead', 'price'])

X = df[['crop_code', 'months_ahead']].values
y = df['price'].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Train model ───────────────────────────────────────────────
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────
y_pred = model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)
print(f"Model trained  |  MAE: {mae:.2f}  |  R²: {r2:.4f}")

# ── Save model ────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), 'price_model.pkl')
with open(out_path, 'wb') as f:
    pickle.dump(model, f)
print(f"Model saved → {out_path}")
