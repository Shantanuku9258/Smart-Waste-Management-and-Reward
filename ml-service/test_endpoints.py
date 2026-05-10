import app
from flask import Flask
import json

def run_tests():
    print("Loading models...")
    app.load_models()
    client = app.app.test_client()
    
    payload = {
      "state": "Tamil Nadu",
      "year": 2024,
      "month": 5,
      "collection_centres": 162
    }
    
    try:
        resp1 = client.post('/predict/ewaste-generation', json=payload)
        print("Generation Response:", resp1.status_code, resp1.get_json())
        
        resp2 = client.post('/predict/ewaste-demand', json=payload)
        print("Demand Response:", resp2.status_code, resp2.get_json())
        
        resp3 = client.post('/predict/ewaste-priority', json=payload)
        print("Priority Response:", resp3.status_code, resp3.get_json())
        
        resp4 = client.post('/predict/ewaste-generation', json={"state": "Tamil Nadu", "year": "invalid"})
        print("Validation Check:", resp4.status_code, resp4.get_json())
    except Exception as e:
        print("Error during tests:", e)

if __name__ == '__main__':
    run_tests()
