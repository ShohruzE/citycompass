# backend/app/core/model_loader.py
import joblib
from pathlib import Path
import numpy as np

MODEL_PATH = Path("ml/artifacts/nsqi_model.pkl")

#Load the model bundle once at startup
print("🔄 Loading NSQI model from:", MODEL_PATH)
model_bundle = joblib.load(MODEL_PATH)
model = model_bundle["pipeline"]
feature_cols = model_bundle["feature_columns"]
san_map = model_bundle["san_map"]
train_min = model_bundle["train_pred_min"]
train_max = model_bundle["train_pred_max"]
grade_thresholds = model_bundle["grade_thresholds"]

print(f"Loaded NSQI model with {len(feature_cols)} features.")

def predict_nsqi(input_dict):
    """
    Compute NSQI prediction for a neighborhood from feature dictionary.
    Returns z-score, 0–100 index, and letter grade.
    """
    #1. Map user input keys -> sanitized model feature names
    X_row = np.zeros((1, len(feature_cols)))
    for human_name, value in input_dict.items():
        if human_name in san_map:
            idx = feature_cols.index(san_map[human_name])
            X_row[0, idx] = value

    #2. Predict z-score
    z = float(model.predict(X_row)[0])

    #3. Convert z-score -> 0–100 index
    index_0_100 = 100 * (z - train_min) / (train_max - train_min)
    index_0_100 = float(np.clip(index_0_100, 0, 100))

    #4. Convert z -> grade
    def z_to_grade(z):
        if z >= grade_thresholds["A"]:
            return "A"
        elif z >= grade_thresholds["B"]:
            return "B"
        elif z >= grade_thresholds["C"]:
            return "C"
        elif z >= grade_thresholds["D"]:
            return "D"
        else:
            return "F"

    grade = z_to_grade(z)

    return {
        "z_score": z,
        "index_0_100": index_0_100,
        "grade": grade
    }
