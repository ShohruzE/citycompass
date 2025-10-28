#backend/app/api/ml.py
from fastapi import APIRouter, HTTPException
from app.model_loader import predict_nsqi_for_district

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/predict")
def predict(community_district: str):
    """
    Example:
    /api/ml/predict?community_district=BK15
    """
    try:
        return predict_nsqi_for_district(community_district)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
