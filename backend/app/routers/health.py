from fastapi import APIRouter

from app.dependencies.database import get_supabase_client
from app.models.health import HealthResponse

router = APIRouter(prefix="/api/v1", tags=["System"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="System Health and Connectivity Check",
    description="Probes the FastAPI application and verifies connection to Supabase database. "
    "Returns status='healthy' if database is accessible, or 'degraded' if an error occurs.",
)
async def health_check() -> HealthResponse:
    try:
        client = get_supabase_client()
        client.table("users").select("id", count="exact").limit(0).execute()
        return HealthResponse(status="healthy", database="connected", error=None)
    except Exception as e:
        return HealthResponse(
            status="degraded",
            database="disconnected",
            error=str(e),
        )
