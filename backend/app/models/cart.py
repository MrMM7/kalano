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


class CartItemDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        description="Unique identifier of the cart item",
        examples=[10],
    )
    seller_product_id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["8fa85f64-5717-4562-b3fc-2c963f66af11"],
    )
    product_id: UUID = Field(
        description="Unique identifier of the parent product",
        examples=["9fa85f64-5717-4562-b3fc-2c963f66af22"],
    )
    product_name: str = Field(
        description="Name of the product",
        examples=["Wireless Noise-Canceling Headphones"],
    )
    product_brand: str = Field(
        description="Brand of the product",
        examples=["AudioTech"],
    )
    product_image_url: str | None = Field(
        default=None,
        description="Public URL for the product image",
        examples=["https://example.com/product.jpg"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant seller",
        examples=["4fa85f64-5717-4562-b3fc-2c963f66af33"],
    )
    seller_name: str = Field(
        description="Display name of the merchant seller",
        examples=["BestAudio Official"],
    )
    unit_price: float = Field(
        description="Price per unit of the seller product offer",
        examples=[199.99],
    )
    stock: int = Field(
        description="Current available inventory stock for the seller offer",
        examples=[15],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        description="Estimated delivery time in days",
        examples=[3],
    )
    quantity: int = Field(
        description="Quantity of this item in the cart",
        examples=[2],
    )
    subtotal: float = Field(
        description="Computed subtotal (unit_price * quantity)",
        examples=[399.98],
    )
    created_at: datetime | str = Field(
        description="Timestamp when the item was added or created",
        examples=["2026-09-05T20:00:00Z"],
    )


class CartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = Field(
        default=None,
        description="Unique identifier of the user's cart (null if user has no cart yet)",
        examples=[1],
    )
    user_id: UUID = Field(
        description="Unique identifier of the user who owns the cart",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    items: list[CartItemDetail] = Field(
        default_factory=list,
        description="List of detailed items in the cart",
    )
    total_items: int = Field(
        default=0,
        description="Total quantity of all items in the cart",
        examples=[2],
    )
    total_price: float = Field(
        default=0.0,
        description="Total price of all items in the cart",
        examples=[399.98],
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(
        ge=1,
        description="Target quantity for the cart item (must be at least 1)",
        examples=[3],
    )


class CartItemDeleteResponse(BaseModel):
    message: str = Field(
        description="Confirmation message after deleting the cart item",
        examples=["Cart item removed successfully."],
    )
