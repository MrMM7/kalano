from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CheckoutRequest(BaseModel):
    address: str = Field(
        min_length=5,
        description=(
            "Physical shipping destination address for delivery (non-empty string, min 5 chars)"
        ),
        examples=["123 Main St, Suite 400, Cityville, CA 94105"],
    )
    save_address: bool = Field(
        default=False,
        description=(
            "Optional flag to save this delivery address to the user's profile in the database"
        ),
        examples=[False],
    )

    @field_validator("address")
    @classmethod
    def validate_address_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Address cannot be empty or contain only whitespace.")
        if len(stripped) < 5:
            raise ValueError("Address must be at least 5 characters long.")
        return stripped


class OrderItemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier of the created order record in user_orders",
        examples=[101],
    )
    product_id: UUID = Field(
        description="Unique identifier of the purchased product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    product_name: str = Field(
        description="Title/name of the purchased product",
        examples=["Ergonomic Mechanical Keyboard"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant seller",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66af77"],
    )
    seller_name: str = Field(
        description="Display name of the merchant seller",
        examples=["KeyTech Store"],
    )
    bought_price: float = Field(
        description="Unit price at the time of purchase",
        examples=[129.99],
    )
    quantity: int = Field(
        description="Number of units ordered",
        examples=[1],
    )
    subtotal: float = Field(
        description="Computed subtotal price (bought_price * quantity)",
        examples=[129.99],
    )
    delivery_types: str = Field(
        description=(
            "Delivery status from custom enum delivered_types. "
            "Values: pending, confirmed, shipped, delivered, cancelled, returned"
        ),
        examples=["pending"],
    )
    address: str = Field(
        description="Delivery shipping address for this order",
        examples=["123 Main St, Suite 400, Cityville, CA 94105"],
    )
    created_at: datetime | str = Field(
        description="Timestamp when the order was placed",
        examples=["2026-09-05T20:00:00Z"],
    )


class CheckoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_ids: list[int] = Field(
        description="List of created order record primary keys",
        examples=[[101, 102]],
    )
    orders: list[OrderItemSummary] = Field(
        description="List of detailed order item summaries",
    )
    total_items: int = Field(
        description="Total quantity of all items ordered",
        examples=[1],
    )
    total_price: float = Field(
        description="Grand total monetary price for all ordered items",
        examples=[129.99],
    )
    message: str = Field(
        default="Order placed successfully.",
        description="User-facing confirmation message",
        examples=["Order placed successfully."],
    )
