import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
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
    
    # ── RECYCLING EFFICIENCY SCORE MODEL ──────────────────────────────────────
    # Regression: predict recycling_efficiency_score (0-100%)
    # Formula: (estimated_collected / estimated_generation) × 100
    if 'recycling_efficiency_score' in df.columns:
        print("\n--- Training Recycling Efficiency Score Model (Regression) ---")
        y_eff = df['recycling_efficiency_score']

        X_train_e, X_test_e, y_train_e, y_test_e = train_test_split(X, y_eff, test_size=0.2, random_state=42)

        eff_model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        eff_model.fit(X_train_e, y_train_e)
        y_pred_e = eff_model.predict(X_test_e)
        rmse_e = np.sqrt(mean_squared_error(y_test_e, y_pred_e))
        r2_e   = r2_score(y_test_e, y_pred_e)
        print(f"RMSE: {rmse_e:.4f}  |  R2 Score: {r2_e:.4f}")

        eff_path = os.path.join(models_dir, 'recycling_efficiency_model.pkl')
        joblib.dump(eff_model, eff_path)
        print(f"Saved to {eff_path}")
    else:
        print("\n[SKIP] recycling_efficiency_score column not found — re-run data_pipeline.py first.")

    # ── GROWTH RATE MODEL ─────────────────────────────────────────────────────
    # Regression: predict year-over-year growth_rate (%)
    # Formula: ((curr_gen - prev_year_gen) / prev_year_gen) × 100
    if 'growth_rate' in df.columns:
        print("\n--- Training Growth Rate Model (Regression) ---")
        y_gr = df['growth_rate']

        X_train_g, X_test_g, y_train_g, y_test_g = train_test_split(X, y_gr, test_size=0.2, random_state=42)

        gr_model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        gr_model.fit(X_train_g, y_train_g)
        y_pred_g = gr_model.predict(X_test_g)
        rmse_g = np.sqrt(mean_squared_error(y_test_g, y_pred_g))
        r2_g   = r2_score(y_test_g, y_pred_g)
        print(f"RMSE: {rmse_g:.4f}  |  R2 Score: {r2_g:.4f}")

        gr_path = os.path.join(models_dir, 'growth_rate_model.pkl')
        joblib.dump(gr_model, gr_path)
        print(f"Saved to {gr_path}")
    else:
        print("\n[SKIP] growth_rate column not found — re-run data_pipeline.py first.")

    print("\nAll e-waste models trained successfully!")

    # ──────────────────────────────────────────────────────────────────────
    # 4. Waste Quantity Prediction Model
    #    Input features: [zone_id, day_of_week, month, historical_waste]
    #    Output:         predicted_waste_kg  (regression)
    # ──────────────────────────────────────────────────────────────────────
    print("\n--- Training Waste Quantity Prediction Model (Regression) ---")

    np.random.seed(42)
    N = 12000

    zone_ids       = np.random.randint(1, 21, N)        # zones 1-20
    days_of_week   = np.random.randint(0, 7, N)         # 0=Mon … 6=Sun
    months         = np.random.randint(1, 13, N)        # 1-12
    hist_waste     = np.random.uniform(10, 500, N)      # kg

    # Target: realistic seasonal + day-of-week + zone variation
    seasonal_factor  = 1 + 0.15 * np.sin(months / 12 * 2 * np.pi)
    weekday_factor   = np.where(days_of_week < 5, 1.0, 0.85)           # less waste on weekends
    zone_factor      = 1 + (zone_ids - 1) * 0.01                       # larger zones generate more
    noise            = np.random.normal(1.0, 0.08, N)

    predicted_waste  = hist_waste * seasonal_factor * weekday_factor * zone_factor * noise
    predicted_waste  = np.clip(predicted_waste, 0, None)

    X_qty = np.column_stack([zone_ids, days_of_week, months, hist_waste])
    y_qty = predicted_waste

    X_train_q, X_test_q, y_train_q, y_test_q = train_test_split(X_qty, y_qty, test_size=0.2, random_state=42)

    qty_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    qty_model.fit(X_train_q, y_train_q)

    y_pred_q = qty_model.predict(X_test_q)
    rmse_q   = np.sqrt(mean_squared_error(y_test_q, y_pred_q))
    r2_q     = r2_score(y_test_q, y_pred_q)
    print(f"RMSE: {rmse_q:.2f}  |  R2 Score: {r2_q:.4f}")

    qty_path = os.path.join(models_dir, 'waste_quantity_model.pkl')
    joblib.dump(qty_model, qty_path)
    print(f"Saved to {qty_path}")

    # ──────────────────────────────────────────────────────────────────────
    # 5. Waste Type Classification Model + LabelEncoder
    #    Input features: [has_plastic, has_organic, has_metal, has_paper,
    #                     has_electronic, has_chemical]  (0.0 – 1.0 each)
    #    Labels:         DRY | WET | E_WASTE | HAZARDOUS
    # ──────────────────────────────────────────────────────────────────────
    print("\n--- Training Waste Classification Model ---")

    np.random.seed(0)
    M = 6000   # samples per class
    noise_std = 0.1

    def make_samples(base_vec, label, n):
        """Generate n noisy samples from a base feature vector."""
        samples = np.clip(
            np.random.normal(loc=base_vec, scale=noise_std, size=(n, 6)),
            0.0, 1.0
        )
        return samples, [label] * n

    # DRY: high plastic / metal / paper, low rest
    dry_plastic, dry_lbl  = make_samples([0.8, 0.1, 0.2, 0.2, 0.05, 0.05], 'DRY', M)
    dry_metal,   _        = make_samples([0.2, 0.1, 0.8, 0.2, 0.05, 0.05], 'DRY', M // 3)
    dry_paper,   _        = make_samples([0.2, 0.1, 0.2, 0.8, 0.05, 0.05], 'DRY', M // 3)

    # WET: high organic, low rest
    wet_samples, wet_lbl  = make_samples([0.1, 0.85, 0.05, 0.05, 0.05, 0.05], 'WET', M)

    # E_WASTE: high electronic, low rest
    ew_samples, ew_lbl    = make_samples([0.1, 0.05, 0.1, 0.05, 0.9, 0.1],  'E_WASTE',   M)

    # HAZARDOUS: high chemical, moderate electronic
    hz_samples, hz_lbl    = make_samples([0.05, 0.05, 0.1, 0.05, 0.3, 0.9], 'HAZARDOUS', M)

    X_cls = np.vstack([dry_plastic, dry_metal, dry_paper, wet_samples, ew_samples, hz_samples])
    y_cls_raw = (dry_lbl + ['DRY'] * (M // 3) + ['DRY'] * (M // 3)
                 + wet_lbl + ew_lbl + hz_lbl)

    # Encode labels
    label_enc = LabelEncoder()
    y_cls = label_enc.fit_transform(y_cls_raw)
    print(f"Classes: {list(label_enc.classes_)}")

    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42, stratify=y_cls)

    cls_model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
    cls_model.fit(X_train_c, y_train_c)

    y_pred_c = cls_model.predict(X_test_c)
    acc_c    = accuracy_score(y_test_c, y_pred_c)
    f1_c     = f1_score(y_test_c, y_pred_c, average='weighted', zero_division=0)
    print(f"Accuracy: {acc_c:.4f}  |  F1 (weighted): {f1_c:.4f}")

    cls_path = os.path.join(models_dir, 'waste_classification_model.pkl')
    enc_path = os.path.join(models_dir, 'waste_label_encoder.pkl')
    joblib.dump(cls_model,  cls_path)
    joblib.dump(label_enc,  enc_path)
    print(f"Saved to {cls_path}")
    print(f"Saved to {enc_path}")

    # ──────────────────────────────────────────────────────────────────────
    # 6. Eco Score Config  (not an ML model — a tunable config dict)
    #    Used by Flask /score/user to apply consistent scoring thresholds.
    # ──────────────────────────────────────────────────────────────────────
    print("\n--- Saving Eco Score Configuration ---")

    eco_score_config = {
        # Points per waste request (capped at 40 total activity score)
        'activity_weight': 2,

        # Request-frequency thresholds (requests / month) → score tiers
        'frequency_thresholds': [2, 5, 10],
        'frequency_scores':     [5, 10, 15, 20],

        # Average weight thresholds (kg / request) → score tiers
        'weight_thresholds': [2.0, 5.0, 10.0],
        'weight_scores':     [2,   5,    7,   10],
    }

    cfg_path = os.path.join(models_dir, 'eco_score_config.pkl')
    joblib.dump(eco_score_config, cfg_path)
    print(f"Saved to {cfg_path}")

    print("\n✓ All models trained and saved successfully!")
    print(f"  Models directory: {models_dir}")
    print("  Files created:")
    for f in sorted(os.listdir(models_dir)):
        if f.endswith('.pkl'):
            size = os.path.getsize(os.path.join(models_dir, f))
            print(f"    {f}  ({size // 1024} KB)")

if __name__ == '__main__':
    build_models()
