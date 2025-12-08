# backend/app/model_loader.py
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

# Add project root to Python path
# Go up 3 levels: model_loader.py -> app/ -> backend/ -> project_root/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.pipeline.preprocess import build_furman_dataset

# ----------------------------------------------------------
# Load model bundle
# ----------------------------------------------------------
MODEL_PATH = ROOT_DIR / "ml" / "artifacts" / "nsqi_model.pkl"
print("🔹 Loading trained NSQI model...")
model_bundle = joblib.load(MODEL_PATH)
print("Model loaded successfully.")

model = model_bundle["pipeline"]
feature_columns = model_bundle["feature_columns"]
train_pred_min = model_bundle.get("train_pred_min", 0)
train_pred_max = model_bundle.get("train_pred_max", 1)
grade_thresholds = model_bundle.get("grade_thresholds", {})

# ----------------------------------------------------------
# Load dataset once and clean
# ----------------------------------------------------------
print("🔹 Building Furman dataset for inference...")
DATA_FOLDER = ROOT_DIR / "ml" / "data" / "raw"
furman_df = build_furman_dataset(folder=DATA_FOLDER)
print(f"Dataset loaded: {furman_df.shape}")

furman_df["community_district"] = (
    furman_df["community_district"].astype(str).str.replace(" ", "").str.strip()
)


# ----------------------------------------------------------
# Predict function
# ----------------------------------------------------------
def predict_nsqi_for_district(community_district: str):
    """Predict NSQI for the latest record of a given community_district."""
    community_district = community_district.replace(" ", "").strip().upper()

    subset = furman_df[furman_df["community_district"] == community_district]
    if subset.empty:
        raise ValueError(f"No records found for {community_district}")

    latest = subset.sort_values("month", ascending=False).head(1)

    # Ensure all features are numeric
    X = latest[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0)

    pred = model.predict(X)[0]
    scaled = (pred - train_pred_min) / (train_pred_max - train_pred_min)
    percentile = np.clip(scaled * 100, 0, 100)

    # Convert to grade
    grade = None
    for g, thr in grade_thresholds.items():
        if pred >= thr:
            grade = g
            break
    grade = grade or "F"

    return {
        "community_district": community_district,
        "predicted_score": float(pred),
        "percentile": round(float(percentile), 2),
        "grade": grade,
    }
