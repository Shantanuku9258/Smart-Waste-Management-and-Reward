import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score

def build_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, 'data', 'ewaste_training_data.csv')
    models_dir = os.path.join(base_dir, 'models')
    
    # Ensure models directory exists
    os.makedirs(models_dir, exist_ok=True)
    
    # 1. Load data
    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Define features
    categorical_features = ['state']
    numeric_features = ['year', 'month', 'collection_centres']
    features = categorical_features + numeric_features
    
    # Preprocessor for all models
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ],
        remainder='passthrough'
    )
    
    print("\n--- Training E-Waste Generation Model (Regression) ---")
    X = df[features]
    y_gen = df['estimated_generation']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_gen, test_size=0.2, random_state=42)
    
    gen_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    gen_model.fit(X_train, y_train)
    y_pred_gen = gen_model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred_gen))
    r2 = r2_score(y_test, y_pred_gen)
    print(f"RMSE: {rmse:.2f}")
    print(f"R2 Score: {r2:.4f}")
    
    gen_model_path = os.path.join(models_dir, 'ewaste_generation_model.pkl')
    joblib.dump(gen_model, gen_model_path)
    print(f"Saved to {gen_model_path}")
    
    print("\n--- Training Collection Demand Model (Classification) ---")
    y_demand = df['demand_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_demand, test_size=0.2, random_state=42)
    
    demand_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    demand_model.fit(X_train, y_train)
    y_pred_demand = demand_model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred_demand)
    prec = precision_score(y_test, y_pred_demand, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred_demand, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred_demand, average='weighted', zero_division=0)
    
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-score:  {f1:.4f}")
    
    demand_model_path = os.path.join(models_dir, 'demand_model.pkl')
    joblib.dump(demand_model, demand_model_path)
    print(f"Saved to {demand_model_path}")
    
    print("\n--- Training Pickup Priority Model (Classification) ---")
    y_priority = df['priority_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_priority, test_size=0.2, random_state=42)
    
    priority_model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    priority_model.fit(X_train, y_train)
    y_pred_priority = priority_model.predict(X_test)
    
    acc_p = accuracy_score(y_test, y_pred_priority)
    prec_p = precision_score(y_test, y_pred_priority, average='weighted', zero_division=0)
    rec_p = recall_score(y_test, y_pred_priority, average='weighted', zero_division=0)
    f1_p = f1_score(y_test, y_pred_priority, average='weighted', zero_division=0)
    
    print(f"Accuracy:  {acc_p:.4f}")
    print(f"Precision: {prec_p:.4f}")
    print(f"Recall:    {rec_p:.4f}")
    print(f"F1-score:  {f1_p:.4f}")
    
    priority_model_path = os.path.join(models_dir, 'priority_model.pkl')
    joblib.dump(priority_model, priority_model_path)
    print(f"Saved to {priority_model_path}")
    
    print("\nAll models trained and saved successfully!")

if __name__ == '__main__':
    build_models()
