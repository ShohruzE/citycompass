# ml/pipeline/train.py
from pathlib import Path
import pandas as pd
import numpy as np
import re
import joblib

import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import rankdata

# -------------------------------------
# 1️⃣ IMPORT PREPROCESSING PIPELINE
# -------------------------------------
from ml.pipeline.preprocess import build_furman_dataset

print("🔄 Building dataset from preprocessing pipeline...")
df = build_furman_dataset()
print("✅ Data loaded successfully.")
print(df.shape)
print(df.columns[:10])

# -------------------------------------
# 2️⃣ FEATURE SELECTION & SANITIZATION
# -------------------------------------
exclude = [
    "community_district","name","month",
    "quality_score","quality_percentile_month",
    "quality_index_0_100","quality_grade","top3_drivers",
    "quality_score_t_plus_6m"
]
feature_cols = [c for c in df.columns if c not in exclude]

def sanitize(name: str) -> str:
    s = str(name)
    s = s.replace("%","pct").replace("$","usd")
    s = re.sub(r"[^\w]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    s = s.lower()
    return s[:120]

san_map, used = {}, set()
for c in feature_cols:
    base = sanitize(c)
    new = base
    i = 1
    while new in used:
        i += 1
        new = f"{base}_{i}"
    san_map[c] = new
    used.add(new)

df_san = df.copy()
df_san.rename(columns=san_map, inplace=True)
san_feature_cols = [san_map[c] for c in feature_cols]
label_col = "quality_score_t_plus_6m"

# -------------------------------------
# 3️⃣ BUILD TRAIN / TEST SETS
# -------------------------------------
y = df_san[label_col]
mask = y.notna()
X = df_san.loc[mask, san_feature_cols].apply(pd.to_numeric, errors="coerce")
y = y.loc[mask]
dates = df_san.loc[mask, "month"]

train_mask = dates < pd.Timestamp("2020-01-01")
X_train, X_test = X[train_mask], X[~train_mask]
y_train, y_test = y[train_mask], y[~train_mask]

print(f"Train: {X_train.shape}, Test: {X_test.shape}")

# -------------------------------------
# 4️⃣ BASELINE MODEL
# -------------------------------------
baseline_model = xgb.XGBRegressor(
    n_estimators=500,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42
)
baseline_model.fit(X_train, y_train)

y_pred = baseline_model.predict(X_test)

mse  = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2   = r2_score(y_test, y_pred)

print(f"Baseline RMSE: {rmse:.3f}")
print(f"Baseline R²:  {r2:.3f}")

# -------------------------------------
# 5️⃣ GRID SEARCH (TUNING)
# -------------------------------------
tscv = TimeSeriesSplit(n_splits=5)
grid = GridSearchCV(
    estimator=xgb.XGBRegressor(objective="reg:squarederror", random_state=42),
    param_grid={
        "n_estimators": [300, 500, 800],
        "max_depth": [4, 6, 8],
        "learning_rate": [0.01, 0.05, 0.1],
        "subsample": [0.8, 1.0],
        "colsample_bytree": [0.8, 1.0],
    },
    cv=tscv,
    scoring="neg_mean_squared_error",
    verbose=2,
    n_jobs=-1,
)

grid.fit(X_train, y_train)
best_model = grid.best_estimator_

best_cv_rmse = (-grid.best_score_)**0.5
print("Best params:", grid.best_params_)
print(f"Best CV RMSE: {best_cv_rmse:.3f}")

# -------------------------------------
# 6️⃣ EVALUATION & INTERPRETATION
# -------------------------------------
y_pred_best = best_model.predict(X_test)
rmse_best = np.sqrt(mean_squared_error(y_test, y_pred_best))
r2_best   = r2_score(y_test, y_pred_best)
print(f"Test RMSE (best): {rmse_best:.3f}")
print(f"Test R² (best):  {r2_best:.3f}")

# Range + mean check (z-score style)
print("Prediction range and mean:")
print(
    "Min:", round(y_pred_best.min(), 3),
    "Max:", round(y_pred_best.max(), 3),
    "Mean:", round(np.mean(y_pred_best), 3)
)

# -------------------------------------
# 7️⃣ CONVERT TO PERCENTILE / INDEX / GRADE
# -------------------------------------
percentile_scores = rankdata(y_pred_best) / len(y_pred_best) * 100
index_scores = 100 * (y_pred_best - y_pred_best.min()) / (y_pred_best.max() - y_pred_best.min())

def z_to_grade(z):
    if z >= 0.3: return "A"
    elif z >= 0.15: return "B"
    elif z >= 0.0: return "C"
    elif z >= -0.15: return "D"
    else: return "F"

grades = [z_to_grade(z) for z in y_pred_best]

df_results = pd.DataFrame({
    "predicted_z": y_pred_best,
    "percentile": percentile_scores,
    "index_0_100": index_scores,
    "grade": grades
})
print("\nSample prediction results:\n", df_results.head())

# -------------------------------------
# 8️⃣ FEATURE IMPORTANCE
# -------------------------------------
importances = best_model.feature_importances_
imp = pd.DataFrame({"feature_sanitized": san_feature_cols, "importance": importances})
imp = imp.sort_values("importance", ascending=False)
rev_map = {v: k for k, v in san_map.items()}
imp["feature"] = imp["feature_sanitized"].map(rev_map)

plt.figure(figsize=(8, 10))
sns.barplot(x="importance", y="feature", data=imp.head(20))
plt.title("Top 20 Feature Importances")
plt.tight_layout()
plt.show()

# -------------------------------------
# 9️⃣ SAVE MODEL + METADATA
# -------------------------------------
train_pred = best_model.predict(X_train)
train_pred_min = float(train_pred.min())
train_pred_max = float(train_pred.max())

model_bundle = {
    "pipeline": best_model,
    "feature_columns": san_feature_cols,
    "san_map": san_map,
    "train_pred_min": train_pred_min,
    "train_pred_max": train_pred_max,
    "grade_thresholds": {
        "A": 0.30,
        "B": 0.15,
        "C": 0.00,
        "D": -0.15
    }
}

Path("ml/artifacts").mkdir(parents=True, exist_ok=True)
joblib.dump(model_bundle, "ml/artifacts/nsqi_model.pkl")
print("Saved to ml/artifacts/nsqi_model.pkl")

print("\nTop features:\n", imp.head(10))
