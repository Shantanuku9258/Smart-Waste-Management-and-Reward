"""
Flask ML Microservice for Smart Waste Management
Exposes REST APIs for:
- Waste quantity prediction
- Waste type classification
- User eco score calculation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Load models on startup
MODELS_DIR = 'models'
models = {}

def load_models():
    """Load all trained ML models"""
    try:
        # Waste quantity prediction model
        models['quantity'] = joblib.load(os.path.join(MODELS_DIR, 'waste_quantity_model.pkl'))
        print("✓ Loaded waste quantity prediction model")
        
        # Waste classification model
        models['classification'] = joblib.load(os.path.join(MODELS_DIR, 'waste_classification_model.pkl'))
        models['label_encoder'] = joblib.load(os.path.join(MODELS_DIR, 'waste_label_encoder.pkl'))
        print("✓ Loaded waste classification model")
        
        # Eco score configuration
        models['eco_score_config'] = joblib.load(os.path.join(MODELS_DIR, 'eco_score_config.pkl'))
        print("✓ Loaded eco score configuration")
        
        print("All models loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

# Load models at startup
if not load_models():
    print("Warning: Models not loaded. Please run train_models.py first.")

@app.route('/ping', methods=['GET'])
def ping():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'ml-service',
        'models_loaded': len(models) > 0
    })

@app.route('/predict/waste', methods=['POST'])
def predict_waste_quantity():
    """
    Predict waste quantity (kg) for a zone
    
    Request body:
    {
        "zoneId": 1,
        "historicalWaste": 150.5,
        "dayOfWeek": 3,  // 0=Monday, 6=Sunday
        "month": 11      // 1-12
    }
    
    Response:
    {
        "predictedWasteKg": 165.3,
        "zoneId": 1,
        "timestamp": "2025-11-11T10:30:00"
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        zone_id = data.get('zoneId')
        historical_waste = data.get('historicalWaste')
        day_of_week = data.get('dayOfWeek')
        month = data.get('month')
        
        if zone_id is None or historical_waste is None:
            return jsonify({'error': 'zoneId and historicalWaste are required'}), 400
        
        # Default values
        if day_of_week is None:
            day_of_week = datetime.now().weekday()
        if month is None:
            month = datetime.now().month
        
        # Validate ranges
        if not (1 <= zone_id <= 100):
            return jsonify({'error': 'zoneId must be between 1 and 100'}), 400
        if not (0 <= day_of_week <= 6):
            return jsonify({'error': 'dayOfWeek must be between 0 (Monday) and 6 (Sunday)'}), 400
        if not (1 <= month <= 12):
            return jsonify({'error': 'month must be between 1 and 12'}), 400
        if historical_waste < 0:
            return jsonify({'error': 'historicalWaste must be non-negative'}), 400
        
        # Prepare features: [zoneId, dayOfWeek, month, historicalWaste]
        features = np.array([[zone_id, day_of_week, month, historical_waste]])
        
        # Predict
        if 'quantity' not in models:
            return jsonify({'error': 'Waste quantity model not loaded'}), 500
        
        predicted_waste = models['quantity'].predict(features)[0]
        predicted_waste = max(0, float(predicted_waste))  # Ensure non-negative
        
        return jsonify({
            'predictedWasteKg': round(predicted_waste, 2),
            'zoneId': zone_id,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/classify/waste', methods=['POST'])
def classify_waste_type():
    """
    Classify waste type based on description/category
    
    Request body:
    {
        "description": "plastic bottles and containers",
        "category": "PLASTIC"  // Optional hint
    }
    
    Response:
    {
        "wasteType": "DRY",
        "confidence": 0.85,
        "timestamp": "2025-11-11T10:30:00"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        description = data.get('description', '').lower()
        category = data.get('category', '').upper()
        
        # Extract features from description
        # Features: [has_plastic, has_organic, has_metal, has_paper, has_electronic, has_chemical]
        features = np.zeros(6)
        
        # Check for keywords in description
        plastic_keywords = ['plastic', 'bottle', 'container', 'bag', 'wrapper']
        organic_keywords = ['organic', 'food', 'vegetable', 'fruit', 'compost', 'wet']
        metal_keywords = ['metal', 'aluminum', 'steel', 'can', 'tin']
        paper_keywords = ['paper', 'cardboard', 'newspaper', 'magazine']
        electronic_keywords = ['electronic', 'e-waste', 'battery', 'phone', 'laptop', 'device']
        chemical_keywords = ['chemical', 'hazardous', 'toxic', 'paint', 'oil', 'battery']
        
        if any(kw in description for kw in plastic_keywords):
            features[0] = 0.8
        if any(kw in description for kw in organic_keywords):
            features[1] = 0.8
        if any(kw in description for kw in metal_keywords):
            features[2] = 0.8
        if any(kw in description for kw in paper_keywords):
            features[3] = 0.8
        if any(kw in description for kw in electronic_keywords):
            features[4] = 0.9
        if any(kw in description for kw in chemical_keywords):
            features[5] = 0.9
        
        # Use category as hint if provided
        if category:
            if category in ['PLASTIC', 'METAL', 'PAPER']:
                features[0] = max(features[0], 0.6) if category == 'PLASTIC' else features[0]
                features[2] = max(features[2], 0.6) if category == 'METAL' else features[2]
                features[3] = max(features[3], 0.6) if category == 'PAPER' else features[3]
            elif category == 'ORGANIC':
                features[1] = 0.8
            elif category == 'E_WASTE':
                features[4] = 0.9
        
        # If no features detected, use default (DRY waste)
        if features.sum() == 0:
            features[0] = 0.5  # Default to plastic/dry
        
        # Predict
        if 'classification' not in models or 'label_encoder' not in models:
            return jsonify({'error': 'Waste classification model not loaded'}), 500
        
        features_array = np.array([features])
        prediction_encoded = models['classification'].predict(features_array)[0]
        prediction_proba = models['classification'].predict_proba(features_array)[0]
        
        # Decode prediction
        waste_type = models['label_encoder'].inverse_transform([prediction_encoded])[0]
        confidence = float(max(prediction_proba))
        
        # Map to standard waste types
        type_mapping = {
            'DRY': 'DRY',
            'WET': 'WET',
            'E_WASTE': 'E_WASTE',
            'HAZARDOUS': 'HAZARDOUS'
        }
        
        waste_type = type_mapping.get(waste_type, 'DRY')
        
        return jsonify({
            'wasteType': waste_type,
            'confidence': round(confidence, 2),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Classification failed: {str(e)}'}), 500

@app.route('/score/user', methods=['POST'])
def calculate_eco_score():
    """
    Calculate user eco score (0-100)
    
    Request body:
    {
        "userId": 1,
        "userActivity": 15,           // Total requests made
        "segregationAccuracy": 85,    // Percentage (0-100)
        "requestFrequency": 8,        // Requests per month
        "avgWeight": 5.5              // Average weight per request (kg)
    }
    
    Response:
    {
        "ecoScore": 72,
        "userId": 1,
        "timestamp": "2025-11-11T10:30:00"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        user_id = data.get('userId')
        user_activity = data.get('userActivity', 0)
        segregation_accuracy = data.get('segregationAccuracy', 0)
        request_frequency = data.get('requestFrequency', 0)
        avg_weight = data.get('avgWeight', 0)
        
        if user_id is None:
            return jsonify({'error': 'userId is required'}), 400
        
        # Validate inputs
        if segregation_accuracy < 0 or segregation_accuracy > 100:
            return jsonify({'error': 'segregationAccuracy must be between 0 and 100'}), 400
        if user_activity < 0:
            return jsonify({'error': 'userActivity must be non-negative'}), 400
        if request_frequency < 0:
            return jsonify({'error': 'requestFrequency must be non-negative'}), 400
        if avg_weight < 0:
            return jsonify({'error': 'avgWeight must be non-negative'}), 400
        
        # Calculate eco score using rule-based logic
        config = models.get('eco_score_config', {})
        
        # Activity score (max 40 points)
        activity_score = min(40, user_activity * config.get('activity_weight', 2))
        
        # Segregation accuracy score (max 30 points)
        segregation_score = (segregation_accuracy / 100) * 30
        
        # Frequency score (max 20 points)
        frequency_thresholds = config.get('frequency_thresholds', [2, 5, 10])
        frequency_scores = config.get('frequency_scores', [5, 10, 15, 20])
        
        if request_frequency >= frequency_thresholds[2]:
            frequency_score = frequency_scores[3]
        elif request_frequency >= frequency_thresholds[1]:
            frequency_score = frequency_scores[2]
        elif request_frequency >= frequency_thresholds[0]:
            frequency_score = frequency_scores[1]
        else:
            frequency_score = frequency_scores[0]
        
        # Weight score (max 10 points)
        weight_thresholds = config.get('weight_thresholds', [2, 5, 10])
        weight_scores = config.get('weight_scores', [2, 5, 7, 10])
        
        if avg_weight >= weight_thresholds[2]:
            weight_score = weight_scores[3]
        elif avg_weight >= weight_thresholds[1]:
            weight_score = weight_scores[2]
        elif avg_weight >= weight_thresholds[0]:
            weight_score = weight_scores[1]
        else:
            weight_score = weight_scores[0]
        
        # Total score
        total_score = activity_score + segregation_score + frequency_score + weight_score
        eco_score = min(100, max(0, int(total_score)))
        
        return jsonify({
            'ecoScore': eco_score,
            'userId': user_id,
            'breakdown': {
                'activityScore': round(activity_score, 1),
                'segregationScore': round(segregation_score, 1),
                'frequencyScore': frequency_score,
                'weightScore': weight_score
            },
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Eco score calculation failed: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Starting ML Service for Smart Waste Management")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5005, debug=True)

