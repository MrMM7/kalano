"use client";

import { useState } from "react";
import Image from "next/image";
import { useProducts } from "@/lib/hooks/use-products";
import {
  useCreateOffer,
  useCreateProductAndOffer,
} from "@/lib/hooks/use-dashboard";
import { ProductListItem } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Package,
  Plus,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface AddOfferTabProps {
  onOfferAdded?: () => void;
}

export function AddOfferTab({ onOfferAdded }: AddOfferTabProps) {
  const [activeMode, setActiveMode] = useState<"catalog" | "new">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductListItem | null>(null);

  // Existing product offer form state
  const [offerPrice, setOfferPrice] = useState("");
  const [offerStock, setOfferStock] = useState("");
  const [offerDeliveryDays, setOfferDeliveryDays] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null);

  // New product + offer form state
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newDeliveryDays, setNewDeliveryDays] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newProductError, setNewProductError] = useState<string | null>(null);

  // Hooks
  const { data: productsData, isLoading: isSearching } = useProducts({
    limit: 20,
    offset: 0,
    q: searchQuery.trim() ? searchQuery.trim() : undefined,
  });

  const createOfferMutation = useCreateOffer();
  const createProductAndOfferMutation = useCreateProductAndOffer();

  const handleCreateOfferForExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setOfferError(null);

    const price = parseFloat(offerPrice);
    const stock = parseInt(offerStock, 10);
    const delivery = offerDeliveryDays.trim()
      ? parseInt(offerDeliveryDays, 10)
      : null;

    if (isNaN(price) || price <= 0) {
      setOfferError("Price must be a valid number strictly greater than 0.");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setOfferError("Stock must be a non-negative integer.");
      return;
    }
    if (delivery !== null && (isNaN(delivery) || delivery < 1)) {
      setOfferError("Estimated delivery days must be at least 1 day.");
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        product_id: selectedProduct.id,
        price,
        stock,
        estimated_delivery_days: delivery,
      });
      toast.success(`Added offer for ${selectedProduct.name}!`);
      setSelectedProduct(null);
      setOfferPrice("");
      setOfferStock("");
      setOfferDeliveryDays("");
      onOfferAdded?.();
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      setOfferError(
        errorObj.error?.message || "Failed to create offer. Please try again."
      );
    }
  };

  const handleCreateNewProductAndOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProductError(null);

    if (!newName.trim()) {
      setNewProductError("Product name is required.");
      return;
    }
    if (!newBrand.trim()) {
      setNewProductError("Brand name is required.");
      return;
    }
    if (!newDescription.trim()) {
      setNewProductError("Product description is required.");
      return;
    }

    const price = parseFloat(newPrice);
    const stock = parseInt(newStock, 10);
    const delivery = newDeliveryDays.trim()
      ? parseInt(newDeliveryDays, 10)
      : null;

    if (isNaN(price) || price <= 0) {
      setNewProductError(
        "Price must be a valid number strictly greater than 0."
      );
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setNewProductError("Stock must be a non-negative integer.");
      return;
    }
    if (delivery !== null && (isNaN(delivery) || delivery < 1)) {
      setNewProductError("Estimated delivery days must be at least 1 day.");
      return;
    }

    try {
      await createProductAndOfferMutation.mutateAsync({
        name: newName.trim(),
        brand: newBrand.trim(),
        description: newDescription.trim(),
        price,
        stock,
        estimated_delivery_days: delivery,
        image: newImageFile,
      });
      toast.success("New product and offer created successfully!");
      // Reset form
      setNewName("");
      setNewBrand("");
      setNewDescription("");
      setNewPrice("");
      setNewStock("");
      setNewDeliveryDays("");
      setNewImageFile(null);
      onOfferAdded?.();
    } catch (err: unknown) {
      const errorObj = err as { error?: { message?: string } };
      setNewProductError(
        errorObj.error?.message ||
          "Failed to create product and offer. Please check your inputs."
      );
    }
  };

  const searchResults = productsData?.items ?? [];

  return (
    <div
      className="space-y-8 max-w-4xl mx-auto"
      data-testid="add-offer-container"
    >
      {/* Mode switcher tabs */}
      <div
        className="flex border-b border-border"
        role="tablist"
        aria-label="Offer creation mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "catalog"}
          onClick={() => setActiveMode("catalog")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            activeMode === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>Search Catalog & Add Offer</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "new"}
          onClick={() => setActiveMode("new")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            activeMode === "new"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Create Brand New Product</span>
        </button>
      </div>

      {/* Mode 1: Search Catalog */}
      {activeMode === "catalog" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              Search Catalog for an Existing Product
            </h3>
            <p className="text-sm text-muted-foreground">
              Find an existing product in Kalano&apos;s catalog to list your
              competitive pricing and available stock.
            </p>

            <div className="relative mt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                data-testid="catalog-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title or brand..."
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Search Results List */}
          {isSearching && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/60 rounded-xl" />
              ))}
            </div>
          )}

          {!isSearching &&
            searchResults.length === 0 &&
            searchQuery.trim() !== "" && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
                <Package className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No products found matching &ldquo;{searchQuery}&rdquo;.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveMode("new")}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    Create &ldquo;{searchQuery}&rdquo; as a new product
                  </span>
                </Button>
              </div>
            )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-3" data-testid="catalog-results-list">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {product.brand}
                      </p>
                      {product.cheapest_offer && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Current lowest price:{" "}
                          <span className="font-medium text-foreground">
                            ${product.cheapest_offer.price.toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product);
                      setOfferError(null);
                    }}
                    aria-label={`Add offer for ${product.name}`}
                    className="gap-1.5 shrink-0"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Add Offer</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Modal for adding offer to selected catalog product */}
          {selectedProduct && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-offer-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
            >
              <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl text-card-foreground">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  disabled={createOfferMutation.isPending}
                  className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 id="add-offer-modal-title" className="text-xl font-bold">
                  Add Your Offer
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Listing offer for{" "}
                  <strong className="text-foreground">
                    {selectedProduct.name}
                  </strong>{" "}
                  ({selectedProduct.brand}).
                </p>

                {offerError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {offerError}
                  </div>
                )}

                <form
                  onSubmit={handleCreateOfferForExisting}
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="offer-price"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Your Price ($) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="offer-price"
                      data-testid="offer-price-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      disabled={createOfferMutation.isPending}
                      placeholder="e.g. 49.99"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="offer-stock"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Available Stock{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="offer-stock"
                      data-testid="offer-stock-input"
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={offerStock}
                      onChange={(e) => setOfferStock(e.target.value)}
                      disabled={createOfferMutation.isPending}
                      placeholder="e.g. 25"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="offer-delivery"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Estimated Delivery Days (Optional)
                    </label>
                    <Input
                      id="offer-delivery"
                      data-testid="offer-delivery-input"
                      type="number"
                      step="1"
                      min="1"
                      value={offerDeliveryDays}
                      onChange={(e) => setOfferDeliveryDays(e.target.value)}
                      disabled={createOfferMutation.isPending}
                      placeholder="e.g. 2"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedProduct(null)}
                      disabled={createOfferMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      data-testid="submit-offer-button"
                      disabled={createOfferMutation.isPending}
                      className="gap-2"
                    >
                      {createOfferMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Submit Offer
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Create New Product + Offer Form */}
      {activeMode === "new" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Create New Catalog Product & Initial Offer
            </h3>
            <p className="text-sm text-muted-foreground">
              If your product is not yet listed in Kalano&apos;s catalog, fill
              out the details below to create both the catalog entry and your
              seller offer.
            </p>
          </div>

          {newProductError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {newProductError}
            </div>
          )}

          <form
            onSubmit={handleCreateNewProductAndOffer}
            data-testid="create-product-form"
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-product-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Product Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="new-product-name"
                  data-testid="new-product-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={createProductAndOfferMutation.isPending}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                />
              </div>

              <div>
                <label
                  htmlFor="new-product-brand"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Brand / Manufacturer{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="new-product-brand"
                  data-testid="new-product-brand"
                  type="text"
                  required
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  disabled={createProductAndOfferMutation.isPending}
                  placeholder="e.g. SoundWave"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-product-desc"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="new-product-desc"
                data-testid="new-product-description"
                required
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                disabled={createProductAndOfferMutation.isPending}
                placeholder="High-fidelity audio with adaptive active noise cancellation..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="new-product-price"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Your Price ($) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="new-product-price"
                  data-testid="new-product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  disabled={createProductAndOfferMutation.isPending}
                  placeholder="e.g. 149.99"
                />
              </div>

              <div>
                <label
                  htmlFor="new-product-stock"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Initial Stock <span className="text-destructive">*</span>
                </label>
                <Input
                  id="new-product-stock"
                  data-testid="new-product-stock"
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  disabled={createProductAndOfferMutation.isPending}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label
                  htmlFor="new-product-delivery"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Est. Delivery Days (Optional)
                </label>
                <Input
                  id="new-product-delivery"
                  data-testid="new-product-delivery"
                  type="number"
                  step="1"
                  min="1"
                  value={newDeliveryDays}
                  onChange={(e) => setNewDeliveryDays(e.target.value)}
                  disabled={createProductAndOfferMutation.isPending}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-product-image"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Product Image (Optional)
              </label>
              <Input
                id="new-product-image"
                data-testid="new-product-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewImageFile(file);
                }}
                disabled={createProductAndOfferMutation.isPending}
                className="cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload JPG, PNG, or WebP image files (stored in Supabase
                products bucket).
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                data-testid="submit-new-product-button"
                disabled={createProductAndOfferMutation.isPending}
                className="gap-2"
              >
                {createProductAndOfferMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Create Product &amp; Offer
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
