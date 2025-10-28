from ml.pipeline.preprocess import build_furman_dataset
import joblib
import pandas as pd
from pathlib import Path

MODEL_PATH = Path("ml/artifacts/nsqi_model.pkl")
model_bundle = joblib.load(MODEL_PATH)
model = model_bundle["pipeline"]
feature_columns = model_bundle["feature_columns"]

furman_df = build_furman_dataset()

furman_df["community_district"] = (
    furman_df["community_district"]
    .astype(str)
    .str.replace(" ", "")
    .str.strip()
)

def predict_nsqi_for_district(community_district: str):
    """Predict NSQI for latest record of a given community_district."""
    community_district = community_district.replace(" ", "").strip()
    subset = furman_df[furman_df["community_district"] == community_district]
    if subset.empty:
        raise ValueError(f"No records found for {community_district}")

    latest = subset.sort_values("month", ascending=False).head(1)
    X = latest[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0)
    pred = model.predict(X)
    return {
        "community_district": community_district,
        "predicted_score": float(pred[0])
    }

if __name__ == "__main__":
    print("Testing model loader...")
    result = predict_nsqi_for_district("BK15")
    print(result)
