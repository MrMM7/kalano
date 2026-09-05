from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CartItemCreate(BaseModel):
    seller_product_id: UUID = Field(
        description="Unique identifier of the seller product offer in seller_products",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    quantity: int = Field(
        default=1,
        gt=0,
        description="Quantity of the product to add to the cart (must be at least 1)",
        examples=[1],
    )


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier of the cart item",
        examples=[1],
    )
    cart_id: int = Field(
        description="Unique identifier of the user's cart",
        examples=[1],
    )
    seller_product_id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    quantity: int = Field(
        description="Final quantity of the item in the cart",
        examples=[2],
    )
    created_at: datetime | str = Field(
        description="Timestamp when the item was added or created",
        examples=["2026-09-05T20:00:00Z"],
    )
