from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductRecord(BaseModel):
    """Database record mapping for products table."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str
    brand: str
    image_url: str | None = None
    created_at: datetime | str | None = None


class SellerUserInfo(BaseModel):
    """Joined user record information on seller offers."""

    model_config = ConfigDict(from_attributes=True)

    display_name: str | None = None


class SellerOfferRecord(BaseModel):
    """Database record mapping for seller_products table joined with users."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    seller_id: UUID
    price: float
    stock: int
    estimated_delivery_days: int | None = None
    created_at: datetime | str | None = None
    users: SellerUserInfo | None = None


class ProductOffers(list[SellerOfferRecord]):
    """Collection of seller offers for a product inheriting from list."""

    def cheapest_offer(self) -> "CheapestOfferResponse | None":
        """Determine and return the cheapest in-stock offer, breaking ties cleanly."""
        if not self:
            return None

        def offer_sort_key(item: SellerOfferRecord):
            price = float(item.price)
            delivery = item.estimated_delivery_days
            delivery_val = float("inf") if delivery is None else float(delivery)
            created_at_val = str(item.created_at or "")
            return (price, delivery_val, created_at_val)

        best_offer = min(self, key=offer_sort_key)
        seller_name = (
            best_offer.users.display_name
            if best_offer.users and best_offer.users.display_name
            else "Unknown Seller"
        )

        return CheapestOfferResponse(
            seller_product_id=best_offer.id,
            seller_id=best_offer.seller_id,
            seller_name=seller_name,
            price=float(best_offer.price),
            stock=int(best_offer.stock),
            estimated_delivery_days=best_offer.estimated_delivery_days,
        )


class CatalogOffersMap(dict[UUID, ProductOffers]):
    """Custom mapping of product UUID to its ProductOffers collection."""

    @classmethod
    def from_records(cls, records: list[SellerOfferRecord]) -> "CatalogOffersMap":
        """Group a flat list of SellerOfferRecord instances by their product_id."""
        mapping = cls()
        for record in records:
            if record.product_id not in mapping:
                mapping[record.product_id] = ProductOffers()
            mapping[record.product_id].append(record)
        return mapping

    def get_cheapest_for_product(self, product_id: UUID) -> "CheapestOfferResponse | None":
        """Retrieve the cheapest offer for a given product ID, or None if no offers exist."""
        offers = self.get(product_id)
        return offers.cheapest_offer() if offers else None


class CheapestOfferResponse(BaseModel):
    """Details of the lowest-priced available in-stock offer from a seller."""

    model_config = ConfigDict(from_attributes=True)

    seller_product_id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66afa7"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant / seller",
        examples=["9da85f64-5717-4562-b3fc-2c963f66afa8"],
    )
    seller_name: str = Field(
        description="Display name of the seller",
        examples=["AudioTech Store"],
    )
    price: float = Field(
        description="Unit price of the product offered by the seller in USD",
        examples=[149.99],
    )
    stock: int = Field(
        description="Available inventory count (strictly greater than zero)",
        examples=[25],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        description="Estimated delivery transit duration in calendar days",
        examples=[3],
    )


class ProductListItemResponse(BaseModel):
    """Catalog product item including the cheapest in-stock offer if available."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique identifier of the product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    name: str = Field(
        description="Product name / title",
        examples=["Wireless Noise-Cancelling Headphones"],
    )
    description: str = Field(
        description="Detailed product description",
        examples=["High-fidelity audio with adaptive active noise cancellation."],
    )
    brand: str = Field(
        description="Manufacturer or brand name",
        examples=["SoundWave"],
    )
    image_url: str | None = Field(
        default=None,
        description="Public URL for product image, null if no image has been uploaded",
        examples=["https://example.com/images/headphones.jpg"],
    )
    cheapest_offer: CheapestOfferResponse | None = Field(
        default=None,
        description="Lowest-priced in-stock seller offer, or null if currently out of stock",
    )


class ProductsListResponse(BaseModel):
    """Paginated response containing catalog product items and count metadata."""

    items: list[ProductListItemResponse] = Field(
        description="Array of product items for the requested page slice",
    )
    total: int = Field(
        description="Total number of products matching query criteria",
        examples=[42],
    )
    limit: int = Field(
        description="Maximum number of items requested",
        examples=[10],
    )
    offset: int = Field(
        description="Number of items skipped for pagination",
        examples=[0],
    )


class SellerOfferItem(BaseModel):
    """Detailed seller offer item associated with a product."""

    model_config = ConfigDict(from_attributes=True)

    seller_product_id: UUID = Field(
        description="Unique identifier of the seller product offer",
        examples=["7ca85f64-5717-4562-b3fc-2c963f66afa7"],
    )
    seller_id: UUID = Field(
        description="Unique identifier of the merchant / seller",
        examples=["9da85f64-5717-4562-b3fc-2c963f66afa8"],
    )
    seller_name: str = Field(
        description="Display name of the seller",
        examples=["AudioTech Store"],
    )
    price: float = Field(
        description="Unit price of the product offered by the seller in USD",
        examples=[149.99],
    )
    stock: int = Field(
        description="Available inventory count (0 or greater)",
        examples=[25],
    )
    estimated_delivery_days: int | None = Field(
        default=None,
        description="Estimated delivery transit duration in calendar days",
        examples=[3],
    )


class ProductDetailResponse(BaseModel):
    """Complete product detail specification including all seller offers."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(
        description="Unique identifier of the product",
        examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
    )
    name: str = Field(
        description="Product name / title",
        examples=["Wireless Noise-Cancelling Headphones"],
    )
    description: str = Field(
        description="Detailed product description",
        examples=[
            "High-fidelity audio with adaptive active noise cancellation and 30-hour battery life."
        ],
    )
    brand: str = Field(
        description="Manufacturer or brand name",
        examples=["SoundWave"],
    )
    image_url: str | None = Field(
        default=None,
        description="Public URL for product image, null if no image has been uploaded",
        examples=["https://example.com/images/headphones.jpg"],
    )
    created_at: datetime | str | None = Field(
        default=None,
        description="Timestamp when the product was added to the catalog",
        examples=["2026-09-01T12:00:00Z"],
    )
    cheapest_offer: CheapestOfferResponse | None = Field(
        default=None,
        description="Lowest-priced in-stock seller offer, or null if currently out of stock",
    )
    offers: list[SellerOfferItem] = Field(
        default_factory=list,
        description="All active seller offers for this product, sorted by price ascending",
    )
