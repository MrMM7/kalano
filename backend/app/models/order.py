from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrderDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier of the order record in user_orders",
        examples=[105],
    )
    product_id: UUID = Field(
        description="Unique identifier of the purchased product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    product_name: str = Field(
        description="Title or name of the purchased product",
        examples=["Ergonomic Mechanical Keyboard"],
    )
    product_brand: str = Field(
        description="Brand name of the product",
        examples=["KeyTech"],
    )
    product_image_url: str | None = Field(
        default=None,
        description="URL of the product image if available",
        examples=["https://example.com/keyboard.jpg"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant seller",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66af77"],
    )
    seller_name: str = Field(
        description="Display name of the merchant seller",
        examples=["KeyTech Official"],
    )
    bought_price: float = Field(
        description="Unit price of the item at purchase time",
        examples=[129.99],
    )
    quantity: int = Field(
        description="Quantity of units ordered",
        examples=[1],
    )
    subtotal: float = Field(
        description="Computed line item subtotal (bought_price * quantity)",
        examples=[129.99],
    )
    delivery_types: str = Field(
        description=(
            "Delivery fulfillment status from delivered_types enum. "
            "Allowed values: pending, confirmed, shipped, delivered, cancelled, returned"
        ),
        examples=["pending"],
    )
    address: str = Field(
        description="Shipping destination address for this order",
        examples=["123 Main St, Suite 400, Cityville, CA 94105"],
    )
    created_at: datetime | str = Field(
        description="Timestamp when the order was placed",
        examples=["2026-09-05T21:00:00Z"],
    )


class OrderListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    orders: list[OrderDetailResponse] = Field(
        description="Chronologically sorted list of buyer orders (newest first)",
    )
    total_orders: int = Field(
        description="Total number of orders placed by the buyer",
        examples=[1],
    )
