# Nandvanshi Dairy Security Specification

## Data Invariants
- A customer can only view and manage their own orders.
- Only admins can manage products, categories, and promo codes.
- Orders must have a valid status flow (Pending -> Preparing/Out for delivery -> Delivered).
- Bulk orders require a minimum lead time and quantity.

## The "Dirty Dozen" Payloads (Examples)
1. **Identity Spoof**: Non-admin attempting to create a product.
2. **Resource Poisoning**: Extremely long string as a product ID.
3. **Price Manipulation**: Customer trying to set the price of a product during order creation.
4. **Status Hijack**: Customer trying to mark an order as "Delivered."
5. **Orphaned Order**: Creating an order for a non-existent product.
6. **Timeline Breach**: Scheduling a delivery in the past.
7. **Promo Inflation**: Applying multiple promo codes to one order.
8. **Shadow Field**: Adding `isAdmin: true` to a user profile payload.
9. **Bulk Bypass**: Placing a bulk order with quantity 1.
10. **Express Overload**: Requesting express delivery outside delivery hours.
11. **History Leak**: Attempting to read another user's order history.
12. **Inventory Exhaustion**: Ordering more stock than available (logic check).

## Blueprint
(To be implemented in firebase-blueprint.json)
