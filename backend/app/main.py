from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.dependencies.config import settings
from app.routers import health

app = FastAPI(
    title="Kalano API",
    description="Multi-vendor e-commerce platform API for Kalano",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
