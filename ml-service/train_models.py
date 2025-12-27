"""
ML Model Training Script
Trains and saves three ML models:
1. Waste Quantity Prediction (RandomForest)
2. Waste Type Classification (Logistic Regression)
3. User Eco Score (Rule-based + ML)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import joblib
import os

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

print("=" * 60)
print("Training ML Models for Smart Waste Management")
print("=" * 60)

# ============================================================================
# 1. WASTE QUANTITY PREDICTION MODEL
# ============================================================================
print("\n[1/3] Training Waste Quantity Prediction Model...")

# Generate synthetic training data for waste quantity prediction
# In production, this would come from historical waste_logs data
np.random.seed(42)
n_samples = 1000

# Features: zoneId, dayOfWeek (0-6), month (1-12), historicalAvgWaste
zone_ids = np.random.randint(1, 11, n_samples)  # 10 zones
day_of_week = np.random.randint(0, 7, n_samples)
month = np.random.randint(1, 13, n_samples)
historical_avg = np.random.uniform(50, 500, n_samples)  # Historical average waste in kg

# Target: predicted waste quantity (kg)
# Formula: base + zone_factor + day_factor + seasonal_factor + noise
zone_factors = {1: 100, 2: 150, 3: 200, 4: 120, 5: 180, 6: 90, 7: 250, 8: 110, 9: 160, 10: 140}
day_factors = {0: 0.8, 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.2, 5: 1.3, 6: 0.7}  # Weekend higher
seasonal_factors = {1: 0.9, 2: 0.95, 3: 1.0, 4: 1.05, 5: 1.1, 6: 1.15, 
                    7: 1.1, 8: 1.05, 9: 1.0, 10: 0.95, 11: 0.9, 12: 0.85}

predicted_waste = []
for i in range(n_samples):
    base = historical_avg[i]
    zone_factor = zone_factors.get(zone_ids[i], 100)
    day_factor = day_factors.get(day_of_week[i], 1.0)
    seasonal_factor = seasonal_factors.get(month[i], 1.0)
    noise = np.random.normal(0, 20)
    waste = base * 0.3 + zone_factor * 0.3 + (base * day_factor * seasonal_factor) * 0.4 + noise
    predicted_waste.append(max(10, waste))  # Minimum 10 kg

X_quantity = np.column_stack([zone_ids, day_of_week, month, historical_avg])
y_quantity = np.array(predicted_waste)

# Split and train
X_train_q, X_test_q, y_train_q, y_test_q = train_test_split(
    X_quantity, y_quantity, test_size=0.2, random_state=42
)

rf_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
rf_model.fit(X_train_q, y_train_q)

# Evaluate
y_pred_q = rf_model.predict(X_test_q)
mse = mean_squared_error(y_test_q, y_pred_q)
rmse = np.sqrt(mse)
print(f"  [OK] Model trained. RMSE: {rmse:.2f} kg")

# Save model
joblib.dump(rf_model, 'models/waste_quantity_model.pkl')
print("  [OK] Model saved: models/waste_quantity_model.pkl")

# ============================================================================
# 2. WASTE TYPE CLASSIFICATION MODEL
# ============================================================================
print("\n[2/3] Training Waste Type Classification Model...")

# Generate synthetic training data for waste classification
# Features: waste description keywords, category hints
waste_types = ['DRY', 'WET', 'E_WASTE', 'HAZARDOUS']
n_class_samples = 500

# Create feature vectors based on waste descriptions
# Features: [has_plastic, has_organic, has_metal, has_paper, has_electronic, has_chemical]
training_data = []
training_labels = []

for _ in range(n_class_samples):
    # Random feature vector
    features = np.random.rand(6)
    
    # Determine label based on dominant features
    if features[4] > 0.6:  # Electronic
        label = 'E_WASTE'
    elif features[5] > 0.6:  # Chemical
        label = 'HAZARDOUS'
    elif features[1] > 0.5:  # Organic
        label = 'WET'
    else:  # Dry waste (plastic, metal, paper)
        label = 'DRY'
    
    training_data.append(features)
    training_labels.append(label)

X_class = np.array(training_data)
y_class = np.array(training_labels)

# Encode labels
label_encoder = LabelEncoder()
y_class_encoded = label_encoder.fit_transform(y_class)

# Split and train
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
    X_class, y_class_encoded, test_size=0.2, random_state=42
)

lr_model = LogisticRegression(max_iter=1000, random_state=42)
lr_model.fit(X_train_c, y_train_c)

# Evaluate
y_pred_c = lr_model.predict(X_test_c)
accuracy = accuracy_score(y_test_c, y_pred_c)
print(f"  [OK] Model trained. Accuracy: {accuracy:.2%}")

# Save model and label encoder
joblib.dump(lr_model, 'models/waste_classification_model.pkl')
joblib.dump(label_encoder, 'models/waste_label_encoder.pkl')
print("  [OK] Model saved: models/waste_classification_model.pkl")
print("  [OK] Label encoder saved: models/waste_label_encoder.pkl")

# ============================================================================
# 3. USER ECO SCORE MODEL (Rule-based + ML)
# ============================================================================
print("\n[3/3] User Eco Score Calculation (Rule-based)...")

# Eco score is primarily rule-based but can be enhanced with ML
# We'll create a simple function that combines multiple factors

def calculate_eco_score(user_activity, segregation_accuracy, request_frequency, avg_weight):
    """
    Calculate eco score (0-100) based on user behavior
    
    Parameters:
    - user_activity: Number of requests made
    - segregation_accuracy: Percentage of correctly classified waste (0-100)
    - request_frequency: Requests per month
    - avg_weight: Average waste weight per request (kg)
    """
    # Base score from activity
    activity_score = min(40, user_activity * 2)  # Max 40 points
    
    # Segregation accuracy (0-30 points)
    segregation_score = (segregation_accuracy / 100) * 30
    
    # Frequency bonus (0-20 points)
    if request_frequency >= 10:
        frequency_score = 20
    elif request_frequency >= 5:
        frequency_score = 15
    elif request_frequency >= 2:
        frequency_score = 10
    else:
        frequency_score = 5
    
    # Weight bonus (0-10 points)
    if avg_weight >= 10:
        weight_score = 10
    elif avg_weight >= 5:
        weight_score = 7
    elif avg_weight >= 2:
        weight_score = 5
    else:
        weight_score = 2
    
    total_score = activity_score + segregation_score + frequency_score + weight_score
    return min(100, max(0, int(total_score)))

# Save the function as a simple rule-based model
# In production, this could be enhanced with ML
eco_score_config = {
    'activity_weight': 2,
    'segregation_weight': 0.3,
    'frequency_thresholds': [2, 5, 10],
    'frequency_scores': [5, 10, 15, 20],
    'weight_thresholds': [2, 5, 10],
    'weight_scores': [2, 5, 7, 10]
}

joblib.dump(eco_score_config, 'models/eco_score_config.pkl')
print("  [OK] Eco score configuration saved: models/eco_score_config.pkl")

print("\n" + "=" * 60)
print("All models trained and saved successfully!")
print("=" * 60)
print("\nModels saved in: ./models/")
print("  - waste_quantity_model.pkl")
print("  - waste_classification_model.pkl")
print("  - waste_label_encoder.pkl")
print("  - eco_score_config.pkl")

