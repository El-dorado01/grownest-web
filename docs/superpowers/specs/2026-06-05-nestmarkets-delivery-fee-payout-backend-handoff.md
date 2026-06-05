# NestMarkets — Delivery-Fee Payout Fix (Backend Handoff)

> **Date:** 2026-06-05
> **Status:** Backend handoff — resolves the 🔴 stopgap flagged since the buyer checkout cycle.
> **Owner:** Backend developer (`GrowNest.Africa`). Frontend adjusts afterward.
> **Primary file:** `src/routes/nestmarkets.ts` (`/checkout`, `/orders/:id/accept`, `/orders/:id/reject`).

---

## 1. Problem (verified in code)

At checkout the money does not reconcile. Current behaviour:

- Buyer is charged **`chargeTotal = totalAmount (items) + deliveryFee`**.
- `adminFee = market_admin_fee_percentage % of totalAmount` (delivery is NOT in the admin-fee base).
- `sellerAmount = totalAmount − adminFee`.
- On `/checkout`: buyer debited `chargeTotal`; seller store `pendingBalanceEnc += sellerAmount`; order persists a `deliveryFee` column; buyer gets a `market_purchase` purse transaction for `chargeTotal`.
- On `/orders/:id/accept`: store `pendingBalanceEnc −= sellerAmount`; seller wallet `+= sellerAmount`; a `market_sale` purse transaction is written.

**The hole:** money leaving the buyer per order = `sellerAmount + adminFee + deliveryFee`. Money credited to a named account with a ledger entry = `sellerAmount` only. The **`deliveryFee`** (and, relatedly, the **`adminFee`**) is never credited anywhere and never recorded — it is unaccounted platform float. The `deliveryFee` is the 🔴 item; the unrecorded `adminFee` is a closely-related accounting gap worth fixing in the same pass.

Current stopgap marker lives in `/checkout` around the `// 🔴🔴 IMPORTANT — TEMPORARY` comment.

---

## 2. Decision required BEFORE coding (product/finance call)

**Who owns the delivery fee?**

- **Option A — Platform keeps it (recommended).** Delivery zones + fees are platform-configured (`nesttrails`); there is no delivery-partner integration. So the platform owns delivery. Requires recording it as platform revenue with a real ledger entry.
- **Option B — Seller keeps it.** Only correct if sellers arrange their own delivery. Simplest code (fold into `sellerAmount`).
- **Option C — Delivery partner.** The long-term model, but needs a partner payout system that does not exist yet. Out of scope now.

> **CONFIRM A vs B with whoever owns GrowNest finances.** Recommendation: **A**, but record the fee explicitly so it is auditable and can be redirected to delivery partners later (Option C) without another rewrite.

**Reconciliation invariant (must hold after the fix, either option):**
```
buyerCharge (chargeTotal) === sellerAmount + adminFee + deliveryFee
```
Every order must produce ledger entries that sum to the buyer charge.

---

## 3. Implementation

### Option A — Platform keeps the delivery fee (recommended)
1. `/checkout`: keep `sellerAmount = totalAmount − adminFee` and keep charging the buyer `chargeTotal`. No change to those numbers.
2. Add explicit **platform revenue ledger records** for `deliveryFee` and `adminFee`. Choose whichever matches existing platform-accounting conventions:
   - a `purseTransaction` on a designated platform/admin profile, **or**
   - a dedicated table, e.g. `MarketLedger { id, orderId, type: "delivery_fee" | "admin_fee", amount, createdAt }`.
3. **When to recognise delivery/admin revenue:** recommended on **buyer acceptance** (`/orders/:id/accept`), alongside the existing `sellerAmount` payout — so a rejected/refunded order never books the revenue. If instead recorded at checkout, the dispute/refund path (§3 shared) MUST reverse it.
4. After acceptance, the ledger for the order must reconcile to the invariant in §2.

### Option B — Seller keeps the delivery fee
1. `/checkout`: change `sellerAmount = (totalAmount − adminFee) + deliveryFee`. The existing pending-balance + accept payout flow then carries it through unchanged.
2. Decide whether `adminFee` should also apply to `deliveryFee` (currently admin fee is on items only). The `adminFee` recording gap from §1 still applies — record it.

### Shared (both options)
- **Dispute / reject (`/orders/:id/reject`):** there is currently no refund at all. Decide and implement: does a rejected order refund the buyer (items and/or delivery)? Ensure **no** delivery/admin revenue or seller payout is booked for rejected orders, and reverse any pending amounts. (A full returns/refunds flow is a separate roadmap item; at minimum make reject not leave money mis-booked.)
- Surface the new entries in the relevant transaction history (seller and/or admin) so they are visible.
- Preserve the existing **optimistic-locking** (`version` increment) pattern on every `nestPurse` / `marketStore` update.
- Remove the 🔴 stopgap comment block in `/checkout` once done.
- Keep the encrypted-balance helpers (`encryptBalance`/`decryptBalance`) for any wallet writes.

---

## 4. Acceptance criteria
- For any completed (accepted) order: recorded ledger entries sum exactly to the buyer's `chargeTotal` (no unaccounted float).
- Delivery fee has a named destination (platform ledger or seller wallet per the decision) and an auditable record.
- Rejected orders book no payout/revenue and leave no negative or orphaned pending balance.
- Optimistic locking preserved; existing happy-path checkout/accept behaviour for `sellerAmount` unchanged (Option A) or correctly increased (Option B).

---

## 5. Frontend impact (handled separately, after backend ships)
- **Option A:** no functional FE change needed — buyer checkout already shows items + delivery + total; seller earnings reflect `sellerAmount` (unchanged). Optional: a fee-breakdown line ("delivery fee goes to GrowNest") on order/earnings detail.
- **Option B:** near-zero — `sellerAmount` / `totalEarned` / `pendingBalance` already flow through the existing seller earnings UI; larger amounts appear automatically. Optional: label delivery as part of seller earnings.
- **If refund-on-reject is added:** the frontend will surface refund status on the buyer order card (small addition; tracked with the returns/refunds roadmap item).

Frontend will adjust once the backend change is deployed and the A/B decision is known.
