# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload_routes import router as upload_router
from app.api.health_routes import router as health_router
from app.api.auto_align_routes import router as auto_align_router

app = FastAPI(title="Inventory Processing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(auto_align_router, prefix="/api")