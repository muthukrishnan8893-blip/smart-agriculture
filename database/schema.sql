-- ============================================================
-- Smart Agriculture Advisory Platform - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_agri;
USE smart_agri;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    state VARCHAR(50),
    district VARCHAR(50),
    crop_type VARCHAR(50),          -- primary crop the farmer grows
    role ENUM('farmer', 'admin') DEFAULT 'farmer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SOIL / FERTILIZER RECOMMENDATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fertilizer_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    soil_type VARCHAR(50),
    crop_type VARCHAR(50),
    nitrogen FLOAT,
    phosphorus FLOAT,
    potassium FLOAT,
    recommended_fertilizer VARCHAR(100),
    quantity_per_acre VARCHAR(50),
    notes TEXT
);

-- ============================================================
-- MARKET PRICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    market_name VARCHAR(100),
    state VARCHAR(50),
    district VARCHAR(50),
    price_per_quintal FLOAT NOT NULL,
    date_recorded DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- GOVERNMENT SCHEMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS government_schemes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    description TEXT,
    applicable_states TEXT,         -- comma-separated state names
    applicable_crops TEXT,          -- comma-separated crop names
    deadline DATE,
    benefit VARCHAR(200),
    apply_link VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DISEASE DETECTION LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS disease_detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_path VARCHAR(300),
    predicted_disease VARCHAR(100),
    confidence FLOAT,
    treatment TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PRICE PREDICTION LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS price_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    crop_name VARCHAR(100),
    state VARCHAR(50),
    predicted_price FLOAT,
    prediction_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SAMPLE DATA: FERTILIZER RECOMMENDATIONS
-- ============================================================
INSERT INTO fertilizer_recommendations (soil_type, crop_type, nitrogen, phosphorus, potassium, recommended_fertilizer, quantity_per_acre, notes) VALUES
('Loamy', 'Wheat', 120, 60, 40, 'Urea + DAP', '50kg Urea + 30kg DAP', 'Apply in two splits - sowing and 30 days after'),
('Clayey', 'Rice', 100, 50, 50, 'Urea + MOP', '45kg Urea + 25kg MOP', 'Flood irrigated; apply urea at transplanting'),
('Sandy', 'Maize', 80, 40, 30, 'NPK 10:26:26', '40kg NPK', 'Sandy soil drains fast, split application advised'),
('Black', 'Cotton', 60, 30, 30, 'DAP + Potash', '25kg DAP + 20kg Potash', 'Black soil retains moisture well'),
('Red', 'Groundnut', 20, 40, 40, 'SSP + MOP', '50kg SSP + 20kg MOP', 'Low nitrogen for legumes'),
('Loamy', 'Tomato', 150, 80, 80, 'NPK 19:19:19', '60kg NPK', 'High demand crop; fertigation preferred'),
('Loamy', 'Potato', 180, 90, 120, 'Urea + DAP + MOP', '80kg Urea + 40kg DAP + 60kg MOP', 'Split into 3 doses'),
('Alluvial', 'Sugarcane', 250, 80, 100, 'Urea + SSP + MOP', '100kg Urea + 40kg SSP + 50kg MOP', 'Long duration crop'),
('Loamy', 'Soybean', 30, 60, 40, 'DAP', '50kg DAP', 'Nitrogen fixed by rhizobium'),
('Sandy Loam', 'Onion', 100, 50, 100, 'NPK 15:15:15 + Potash', '50kg NPK + 30kg Potash', 'Potassium important for bulb quality');

-- ============================================================
-- SAMPLE DATA: MARKET PRICES
-- ============================================================
INSERT INTO market_prices (crop_name, market_name, state, district, price_per_quintal, date_recorded) VALUES
('Wheat', 'Azadpur Mandi', 'Delhi', 'Delhi', 2100, '2026-02-01'),
('Rice', 'Amritsar Mandi', 'Punjab', 'Amritsar', 1900, '2026-02-01'),
('Maize', 'Guntur Mandi', 'Andhra Pradesh', 'Guntur', 1650, '2026-02-01'),
('Cotton', 'Rajkot Mandi', 'Gujarat', 'Rajkot', 6200, '2026-02-01'),
('Groundnut', 'Junagadh Mandi', 'Gujarat', 'Junagadh', 5100, '2026-02-01'),
('Tomato', 'Nashik Mandi', 'Maharashtra', 'Nashik', 1200, '2026-02-01'),
('Potato', 'Agra Mandi', 'Uttar Pradesh', 'Agra', 900, '2026-02-01'),
('Soybean', 'Indore Mandi', 'Madhya Pradesh', 'Indore', 3800, '2026-02-01'),
('Onion', 'Lasalgaon Mandi', 'Maharashtra', 'Nashik', 1600, '2026-02-01'),
('Sugarcane', 'Kolhapur Mandi', 'Maharashtra', 'Kolhapur', 350, '2026-02-01'),
('Wheat', 'Azadpur Mandi', 'Delhi', 'Delhi', 2050, '2026-01-01'),
('Rice', 'Amritsar Mandi', 'Punjab', 'Amritsar', 1850, '2026-01-01'),
('Maize', 'Guntur Mandi', 'Andhra Pradesh', 'Guntur', 1600, '2026-01-01'),
('Cotton', 'Rajkot Mandi', 'Gujarat', 'Rajkot', 6000, '2026-01-01'),
('Tomato', 'Nashik Mandi', 'Maharashtra', 'Nashik', 1400, '2026-01-01'),
('Potato', 'Agra Mandi', 'Uttar Pradesh', 'Agra', 850, '2026-01-01'),
('Wheat', 'Azadpur Mandi', 'Delhi', 'Delhi', 1980, '2025-12-01'),
('Rice', 'Amritsar Mandi', 'Punjab', 'Amritsar', 1800, '2025-12-01'),
('Tomato', 'Nashik Mandi', 'Maharashtra', 'Nashik', 900, '2025-12-01'),
('Onion', 'Lasalgaon Mandi', 'Maharashtra', 'Nashik', 2100, '2025-12-01');

-- ============================================================
-- SAMPLE DATA: GOVERNMENT SCHEMES
-- ============================================================
INSERT INTO government_schemes (scheme_name, description, applicable_states, applicable_crops, deadline, benefit, apply_link) VALUES
('PM-KISAN Samman Nidhi', 'Direct income support of Rs 6000/year to all farmer families', 'All States', 'All', '2026-03-31', 'Rs 6000/year direct bank transfer', 'https://pmkisan.gov.in'),
('PM Fasal Bima Yojana', 'Crop insurance scheme for kharif and rabi crops', 'All States', 'Wheat,Rice,Cotton,Maize', '2026-07-31', 'Crop loss compensation', 'https://pmfby.gov.in'),
('Soil Health Card Scheme', 'Free soil testing and health card for farmers', 'All States', 'All', '2026-12-31', 'Free soil nutrient analysis card', 'https://soilhealth.dac.gov.in'),
('National Mission on Oilseeds', 'Support for oilseed cultivation', 'Gujarat,Rajasthan,Madhya Pradesh', 'Groundnut,Soybean,Mustard', '2026-09-30', 'Subsidy on seeds and equipment', 'https://nmoop.gov.in'),
('Per Drop More Crop', 'Micro irrigation subsidy scheme', 'Maharashtra,Karnataka,Andhra Pradesh', 'Tomato,Onion,Cotton', '2026-06-30', '55% subsidy on drip/sprinkler irrigation', 'https://pmksy.gov.in'),
('e-NAM Scheme', 'Online trading of agricultural commodities', 'All States', 'All', NULL, 'Better price discovery through online auction', 'https://enam.gov.in'),
('Kisan Credit Card', 'Short term credit to farmers at subsidized rates', 'All States', 'All', NULL, 'Credit up to Rs 3 lakh at 4% interest', 'https://kisan.gov.in');
