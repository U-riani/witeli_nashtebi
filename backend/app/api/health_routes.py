# backend/app/api/health_routes.py

from fastapi import APIRouter

router = APIRouter(tags=["System"])

@router.get("/health")
def health():
    return {"status": "ok"}