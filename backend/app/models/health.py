from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(
        description="Service health status: 'healthy' or 'degraded'",
        examples=["healthy"],
    )
    database: str = Field(
        description="Database connectivity status: 'connected' or 'disconnected'",
        examples=["connected"],
    )
    error: str | None = Field(
        default=None,
        description="Error details if database is unreachable",
        examples=[None],
    )
