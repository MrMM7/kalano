# Kalano: A simple e-commerce platform similar to Amazon that allows users to buy the same product from multiple different merchants

tl;dr:
A multi-vendor e-commerce platform where multiple sellers can list offers for the same product. Buyers can search for products, automatically get the cheapest in-stock offer (or manually select a specific seller), and have their orders fulfilled and tracked by Kalano's logistics team.

User flow:
Landing page (popular products catalog) -> Search bar (searching and finding matching products) -> Product page (shows product details, default cheapest in-stock seller offer, and a list of alternative sellers) -> Add to cart (defaults to cheapest in-stock seller or a user-selected seller) -> Optional: add more items -> Checkout & Cart purchase (entering delivery address) -> Order placed and sent to logistics.

There are three different user roles on this platform: Buyers, Sellers, and Kalano's Logistics Team.

When the user is creating their account they will be asked "Do you want to become a Merchant or a Buyer" (the wording can be better).

Buyers:
- Browse and search products across the platform.
- View available sellers for each product with their respective price, stock availability, and estimated delivery time.
- Add items to cart (automatically picking the cheapest in-stock seller by default, with the option to choose a specific merchant).
- Place orders, provide delivery address, and view order delivery status.

Merchants:
- Access a dedicated seller dashboard to manage listings, stock quantities, pricing, and estimated fulfillment times.
- When listing a product:
  - Search the platform catalog for the product first.
  - If it exists: Add themselves as a seller under that product with their price, available stock, and delivery time.
  - If it does not exist: Create the new product listing (name, description, image) and add their offer under it.
- Receive order notifications and mark items as ready for pickup.

Kalano's Logistics Team:
- Access a dedicated dashboard at `/logistics` protected by logistics staff permissions.
- View incoming orders, seller pickup details, customer delivery addresses, and delivery statuses.
- Update delivery progress as orders move from pickup to delivery, and close completed deliveries using the "End Delivery" button. 
- These logistical people are automatically selected by the company