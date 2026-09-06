from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LogisticsOrderItemResponse(BaseModel):
    """Represents a customer order enriched with product, merchant, and buyer information
    for logistics fulfillment operations.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier of the order record in user_orders",
        examples=[101],
    )
    product_id: UUID = Field(
        description="Unique identifier of the catalog product",
        examples=["9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"],
    )
    product_name: str = Field(
        description="Title or name of the catalog product",
        examples=["Ergonomic Mechanical Keyboard"],
    )
    product_brand: str = Field(
        description="Brand or manufacturer of the product",
        examples=["KeyTech"],
    )
    product_image_url: str | None = Field(
        default=None,
        description="Public URL to the product image in Supabase Storage if available",
        examples=["https://example.com/images/keyboard.png"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant seller account",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66af77"],
    )
    seller_name: str = Field(
        description="Display name of the merchant seller",
        examples=["KeyTech Official Store"],
    )
    buyer_id: UUID | None = Field(
        default=None,
        description="Unique identifier of the purchasing customer account",
        examples=["4da85f64-5717-4562-b3fc-2c963f66af11"],
    )
    buyer_name: str = Field(
        description="Display name of the buyer who placed the order",
        examples=["Jane Buyer"],
    )
    address: str = Field(
        description="Physical delivery destination shipping address",
        examples=["456 Oak Avenue, Apt 2B, Metropolis, NY 10001"],
    )
    bought_price: float = Field(
        description="Unit price captured at purchase in USD/EUR",
        examples=[129.99],
    )
    quantity: int = Field(
        description="Number of units purchased in this order item",
        examples=[2],
    )
    subtotal: float = Field(
        description="Computed total line amount (bought_price * quantity) rounded to 2 decimals",
        examples=[259.98],
    )
    delivery_types: str = Field(
        description=(
            "Current fulfillment status corresponding to delivered_types enum. "
            "Allowed values: pending, confirmed, shipped, delivered, cancelled, returned"
        ),
        examples=["pending"],
    )
    created_at: datetime | str = Field(
        description="Timestamp when the order was placed",
        examples=["2026-09-06T14:30:00Z"],
    )
