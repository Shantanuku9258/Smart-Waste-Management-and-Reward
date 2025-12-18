# ML Service - Smart Waste Management

Flask microservice for machine learning predictions and classifications.

## Features

- **Waste Quantity Prediction**: Predicts waste quantity (kg) for zones using RandomForest
- **Waste Type Classification**: Classifies waste type (DRY, WET, E_WASTE, HAZARDOUS) using Logistic Regression
- **User Eco Score**: Calculates eco score (0-100) based on user activity and behavior

## Setup

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Train Models

Before running the service, train the ML models:

```bash
python train_models.py
```

This will create:
- `models/waste_quantity_model.pkl` - RandomForest model for waste prediction
- `models/waste_classification_model.pkl` - Logistic Regression model for classification
- `models/waste_label_encoder.pkl` - Label encoder for waste types
- `models/eco_score_config.pkl` - Configuration for eco score calculation

### 3. Run the Service

```bash
python app.py
```

The service will start on `http://localhost:5005`

## API Endpoints

### Health Check
```
GET /ping
```

### Predict Waste Quantity
```
POST /predict/waste
Content-Type: application/json

{
  "zoneId": 1,
  "historicalWaste": 150.5,
  "dayOfWeek": 3,  // Optional: 0=Monday, 6=Sunday
  "month": 11      // Optional: 1-12
}

Response:
{
  "predictedWasteKg": 165.3,
  "zoneId": 1,
  "timestamp": "2025-11-11T10:30:00"
}
```

### Classify Waste Type
```
POST /classify/waste
Content-Type: application/json

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
```

### Calculate Eco Score
```
POST /score/user
Content-Type: application/json

{
  "userId": 1,
  "userActivity": 15,
  "segregationAccuracy": 85,
  "requestFrequency": 8,
  "avgWeight": 5.5
}

Response:
{
  "ecoScore": 72,
  "userId": 1,
  "breakdown": {
    "activityScore": 30.0,
    "segregationScore": 25.5,
    "frequencyScore": 15,
    "weightScore": 7
  },
  "timestamp": "2025-11-11T10:30:00"
}
```

## Model Details

### Waste Quantity Prediction
- **Model**: RandomForest Regressor
- **Features**: zoneId, dayOfWeek, month, historicalWaste
- **Output**: Predicted waste quantity in kg

### Waste Type Classification
- **Model**: Logistic Regression
- **Features**: Extracted from description (plastic, organic, metal, paper, electronic, chemical keywords)
- **Output**: Waste type (DRY, WET, E_WASTE, HAZARDOUS) with confidence score

### User Eco Score
- **Type**: Rule-based calculation
- **Factors**:
  - Activity Score (0-40): Based on total requests
  - Segregation Accuracy (0-30): Based on classification accuracy
  - Frequency Score (0-20): Based on requests per month
  - Weight Score (0-10): Based on average weight per request
- **Output**: Total eco score (0-100)

## Integration with Spring Boot

The Spring Boot backend calls this service using RestTemplate. Configure the ML service URL in `application.properties`:

```properties
ml.service.url=http://localhost:5005
```

## Notes

- Models are trained with synthetic data. In production, retrain with real historical data.
- The service uses CORS to allow requests from the frontend.
- Models are loaded at startup. Restart the service after retraining models.

