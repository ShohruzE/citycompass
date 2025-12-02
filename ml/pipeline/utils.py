# ml/pipeline/utils.py

from pathlib import Path
import joblib
import pandas as pd

# Import preprocessing + dataset builder
from ml.pipeline.preprocess import build_furman_dataset

# ----------------------------
# ARTIFACT PATHS
# ----------------------------
ARTIFACT_DIR = Path("ml/artifacts")
MODEL_PATH = ARTIFACT_DIR / "nsqi_model.pkl"

# -------------------------------------------------
#   LOAD MODEL BUNDLE (THE ONE YOU SAVED IN TRAIN.PY)
# -------------------------------------------------

# Simple placeholder to satisfy import (NOT used by training)
def preprocess_for_model(df, feature_list):
    """
    Ensures df has feature_list columns; missing → 0.
    This does NOT replace your training pipeline!
    It only makes inference safe.
    """
    df = df.reindex(columns=feature_list, fill_value=0)
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)
    return df


def load_model_bundle():
    """
    Loads the full model bundle saved by train.py.
    
    Returns:
        model: XGBRegressor
        feature_columns: list of sanitized feature names
        san_map: raw → sanitized column mapping
        metadata: dict with normalization ranges + grade thresholds
    """
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    bundle = joblib.load(MODEL_PATH)

    model = bundle["pipeline"]
    feature_columns = bundle["feature_columns"]
    san_map = bundle["san_map"]

    metadata = {
        "train_pred_min": bundle["train_pred_min"],
        "train_pred_max": bundle["train_pred_max"],
        "grade_thresholds": bundle["grade_thresholds"],
    }

    print(f"Model loaded. Feature count: {len(feature_columns)}")
    return model, feature_columns, san_map, metadata


# -------------------------------------------------
#    BUILD CITYWIDE PREDICTIONS
#    (Used by the agent to answer questions)
# -------------------------------------------------
def build_citywide_predictions():
    """
    Loads the Furman dataset → sanitizes columns → produces predictions
    exactly the same way the model was trained.

    Output DataFrame includes:
        - predicted_score (regression output)
        - nsqi_index (0–100 scaled version)
        - nsqi_grade (A/B/C/D/F classification)
    """
    print("Loading Furman dataset...")
    df = build_furman_dataset()

    print("Loading model...")
    model, feature_cols, san_map, metadata = load_model_bundle()

    print("Applying sanitization...")
    df_san = df.rename(columns=san_map).copy()

    # Ensure model input matches training structure
    X = df_san.reindex(columns=feature_cols, fill_value=0)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0)

    print("Running predictions...")
    preds = model.predict(X)

    # Recreate the same normalization from training.py
    pred_min = metadata["train_pred_min"]
    pred_max = metadata["train_pred_max"]
    index_0_100 = 100 * (preds - pred_min) / (pred_max - pred_min)

    # Grade logic from training.py
    def score_to_grade(score):
        g = metadata["grade_thresholds"]
        if score >= g["A"]: return "A"
        if score >= g["B"]: return "B"
        if score >= g["C"]: return "C"
        if score >= g["D"]: return "D"
        return "F"

    grades = [score_to_grade(s) for s in preds]

    # Attach results to raw dataset
    df_out = df.copy()
    df_out["predicted_score"] = preds
    df_out["nsqi_index"] = index_0_100
    df_out["nsqi_grade"] = grades

    #print("Citywide prediction dataframe columns:", df_out.columns.tolist())
    #print("Predictions generated for", len(df_out), "rows.")
    return df_out

