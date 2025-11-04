# ML: Neighborhood 6-Month Forecasts

This folder contains the ML pipeline for CityCompass.

**Structure**
- `data/` → raw → interim → processed
- `notebooks/` → EDA & experiments
- `pipeline/` → preprocess, train (evaluate is nested)
- `artifacts/` → saved models + metrics
- `config/default.yaml` → paths, features, params

**Quickstart (conceptual)**
1) Place CSVs/Excels in `ml/data/raw/`
2) Run preprocess → train (eval) (scripts in `ml/pipeline/`)
3) Artifacts land in `ml/artifacts/`
