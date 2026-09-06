from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MerchantOfferItemResponse(BaseModel):
    """Response representation of a merchant offer joined with catalog product information."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66afa7"],
    )
    product_id: UUID = Field(
        description="Unique identifier of the catalog product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    product_name: str = Field(
        description="Title/name of the product",
        examples=["Wireless Noise-Cancelling Headphones"],
    )
    product_brand: str = Field(
        description="Brand of the product",
        examples=["SoundWave"],
    )
    product_description: str = Field(
        description="Detailed description of the product",
        examples=["High-fidelity audio with adaptive active noise cancellation."],
    )
    product_image_url: str | None = Field(
        default=None,
        description="Public URL to the product image in Supabase Storage",
        examples=["https://example.com/images/headphones.jpg"],
    )
    price: float = Field(
        description="Unit price set by the merchant in EUR/USD",
        examples=[149.99],
    )
    stock: int = Field(
        description="Available inventory stock count",
        examples=[25],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        description="Estimated transit/delivery time in days",
        examples=[3],
    )
    created_at: datetime | None = Field(
        default=None,
        description="Timestamp when the offer was created",
        examples=["2026-09-01T12:00:00Z"],
    )
