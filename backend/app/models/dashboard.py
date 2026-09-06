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


class MerchantOfferCreateRequest(BaseModel):
    """Payload for creating a new merchant offer on an existing catalog product."""

    product_id: UUID = Field(
        description="Unique identifier of the target catalog product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    price: float = Field(
        gt=0,
        description="Unit price set by the merchant in EUR/USD (strictly greater than 0)",
        examples=[89.99],
    )
    stock: int = Field(
        ge=0,
        description="Available inventory stock count (must be non-negative)",
        examples=[15],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        ge=1,
        description="Estimated transit/delivery time in days (must be at least 1 day)",
        examples=[2],
    )


class MerchantOfferResponse(BaseModel):
    """Response representation of a newly created or updated merchant product offer."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["8fa85f64-5717-4562-b3fc-2c963f66afa9"],
    )
    product_id: UUID = Field(
        description="Unique identifier of the catalog product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant / seller user",
        examples=["9da85f64-5717-4562-b3fc-2c963f66afa8"],
    )
    price: float = Field(
        description="Unit price set by the merchant in EUR/USD",
        examples=[89.99],
    )
    stock: int = Field(
        description="Available inventory stock count",
        examples=[15],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        description="Estimated transit/delivery time in days",
        examples=[2],
    )
    created_at: datetime | None = Field(
        default=None,
        description="Timestamp when the offer was created",
        examples=["2026-09-06T12:00:00Z"],
    )


class ProductRecordModel(BaseModel):
    """Catalog product details returned upon creation or retrieval."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique identifier of the catalog product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    name: str = Field(
        description="Title/name of the product",
        examples=["Organic Roasted Coffee Beans"],
    )
    description: str = Field(
        description="Detailed description of the product",
        examples=["Medium roast whole bean arabica coffee."],
    )
    brand: str = Field(
        description="Brand or manufacturer of the product",
        examples=["Highland Roasters"],
    )
    image_url: str | None = Field(
        default=None,
        description="Public URL to the uploaded product image in Supabase Storage",
        examples=["https://supabase-storage-url/products/sample.jpg"],
    )
    created_at: datetime | None = Field(
        default=None,
        description="Timestamp when the product was created",
        examples=["2026-09-06T12:00:00Z"],
    )


class MerchantProductCreateResponse(BaseModel):
    """Response payload returned when a merchant creates a new product and initial offer."""

    product: ProductRecordModel = Field(description="Newly created catalog product information")
    offer: MerchantOfferResponse = Field(
        description="Newly created merchant seller offer information"
    )


class MerchantOfferUpdateRequest(BaseModel):
    """Payload for partially updating price, stock, or delivery estimate for a merchant offer."""

    price: float | None = Field(
        default=None,
        gt=0,
        description="Unit price set by the merchant in EUR/USD (strictly greater than 0)",
        examples=[79.99],
    )
    stock: int | None = Field(
        default=None,
        ge=0,
        description="Available inventory stock count (must be non-negative)",
        examples=[50],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        ge=1,
        description="Estimated transit/delivery time in days (must be at least 1 day)",
        examples=[1],
    )


class MerchantOfferDeleteResponse(BaseModel):
    """Response payload confirming successful deletion of a merchant offer."""

    message: str = Field(
        description="Confirmation message upon successful deletion",
        examples=["Offer successfully deleted"],
    )
    id: UUID = Field(
        description="Unique identifier of the deleted seller product offer",
        examples=["8fa85f64-5717-4562-b3fc-2c963f66afa9"],
    )
