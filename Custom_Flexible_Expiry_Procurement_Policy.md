# Implementation Plan: Custom Flexible Expiry Procurement Policy

This document outlines the architecture, database transactions, API endpoints, background jobs, and validation logic required to implement the new partial procurement policy for custom flexible one-time payment plans upon expiration.

---

## User Review Required

> [!IMPORTANT]
> **New Expiration Flow (No 100% Refund by Default):**
> * Instead of automatically cancelling the plan and refunding all saved funds upon grace period expiration, the sweeper job will transition the custom plan status to `"pending_selection"`.
> * The user will be notified of this transition and prompted to select food items from their plan that fit within their saved (decripted) balance.
> * If a user's saved amount is exactly `0`, the plan is cancelled immediately without entering the selection phase (same as before).

> [!IMPORTANT]
> **Greedy Selection/Procurement Constraint:**
> * To prevent users from procuring only a small fraction of their funds and requesting a massive cash refund, we enforce a strict constraint on item selection.
> * When submitting their selection, the remaining balance (`savedFunds - selectedCost`) must be **less than the current price of any remaining unselected items** in the plan.
> * If the remaining balance can buy one or more units of any leftover items in the plan, the API will reject the request with `400 Bad Request`.

---

## Proposed Changes

### 1. Grace Period Sweeper (`GrowNest.Africa`)

#### [MODIFY] [expireFlexiblePlans.ts](file:///c:/Users/hp/Desktop/GrowNest.Africa/src/jobs/expireFlexiblePlans.ts)
Update the background sweep transaction for plans that have passed their grace period:
- **For plans with `paidAmount > 0`**:
  - Instead of updating status to `"cancelled"` and refunding the user's wallet immediately:
    - Update plan status to `"pending_selection"`.
    - Disable auto-pay (`autoPayEnabled: false`, `autoPayPaused: true`, `autoPayNextDate: null`).
    - Send an in-app notification notifying the user that their plan has expired and they need to select items from their plan matching their saved funds of `₦paidAmount`.
    - Create an `ActivityLog` record indicating the plan has transitioned to `"pending_selection"` due to expiration.
- **For plans with `paidAmount === 0`**:
  - Keep the existing logic: update status to `"cancelled"` and write a quiet cancellation log.

---

### 2. User Router & Status Mapping (`GrowNest.Africa`)

#### [MODIFY] [nestbaskets.ts](file:///c:/Users/hp/Desktop/GrowNest.Africa/src/routes/nestbaskets.ts)
Update custom plan list and detail routes to handle the `"pending_selection"` state:
- **Listing & Details (`/my-flexible-plans` and `/flexible-plan/:id`)**:
  - Map `status` to `'pending_selection'` if `plan.status === 'pending_selection'`.
  - Set `canMakePayment = false` and `canEnableAutoPay = false` if status is `'pending_selection'`.
- **Payment Guard (`/flexible-payment`)**:
  - Reject payment attempts if `plan.status === 'pending_selection'` with a descriptive error.

#### [NEW] Procurement Selection API Endpoint (`POST /flexible-plan/:id/procure`)
Create a new endpoint allowing users to select and dispatch items for their expired plan:
- **Validation**:
  - Validate that the plan exists, belongs to the authenticated user, is of `paymentType === 'flexible'`, and has `status === 'pending_selection'`.
  - Expect a body schema of `selectedItems: z.array(z.object({ foodItemId: z.string().uuid(), quantity: z.number().int().min(1) }))`.
- **Logic**:
  1. Load the plan items and their corresponding active `FoodItem` records (to get fresh prices and cost prices).
  2. Map plan items into a helper lookup (dictionary of `foodItemId -> customPlanItem`).
  3. Validate that each selected item is part of the custom plan, and the selected quantity does not exceed the quantity originally defined in the plan: `selectedQty <= planQty`.
  4. Compute total price of selected items: `selectedCost = sum(item.quantity * currentPricePerUnit)`.
  5. Decrypt the user's saved funds: `savedFunds = decryptBalance(plan.paidAmountEnc)`.
  6. Verify `selectedCost <= savedFunds`. If not, reject with `400 Bad Request` ("Selected items cost exceeds your saved funds").
  7. Compute remaining balance: `remainingFunds = savedFunds - selectedCost`.
  8. **Enforce the Greedy Selection Constraint**:
     - Identify remaining unselected item quantities: `remainingQty = planQty - selectedQty`.
     - Check if there exists any item where `remainingQty > 0` AND the current `pricePerUnit <= remainingFunds`.
     - If so, reject the request with `400 Bad Request` ("You still have enough saved funds to select more items from your plan. Please select more items to proceed.").
  9. **Database Transaction Execution**:
     - **Create Delivery**:
       - Create a `Delivery` record linking to the custom plan: `customPlanId: plan.id`, `deliveryProfileId: plan.deliveryProfileId`, `status: 'scheduled'`, `deliveryDate = 2 days from now`, and `addressSnapshot` cloned from the plan's delivery profile.
       - Create `DeliveryItem` snapshots for all selected items, copying their current `pricePerUnit` to `unitPriceAtPurchase` and `costPrice` to `costPriceAtPurchase`.
     - **Update Plan**:
       - Mark the plan status as `"delivered"`, `isPaid = true`, and `isDelivered = true`.
     - **Refund Remainder**:
       - If `remainingFunds > 0`, lock the user's `NestPurse` (`FOR UPDATE`), decrypt the balance, add `remainingFunds`, encrypt the new balance, and update the purse.
       - Create a success `PurseTransaction` record of type `'credit'`, method `'basket_refund'`, and narration `"Refund of unused balance from expired plan: ${plan.title}"`.
     - **Notifications**:
       - Send an in-app notification summarizing the delivery schedule and the wallet refund of `₦remainingFunds`.
       - Create an `ActivityLog` for the procurement transaction.

---

## Verification Plan

### Automated Verification
- Write a test script under `prisma/test-procurement-policy.ts` to assert that:
  - Expiry sweeper transitions plans to `"pending_selection"` and sends notifications instead of refunding 100% immediately.
  - The procurement endpoint succeeds when selecting items that match the saved funds perfectly.
  - The procurement endpoint fails if the user attempts to select items costing more than saved funds.
  - The procurement endpoint fails if the user leaves enough remainder funds to buy another leftover item in the plan.
  - The remaining funds are correctly refunded to their `NestPurse` and a delivery is created for the selected subset of items.

### Manual Verification
1. **Sweeper Check**: Create a custom flexible plan, make a partial payment, set `savingExpiresAt` to yesterday, run the sweeper job, and verify it shifts to `'pending_selection'` status.
2. **Procure Check**: Send a procurement selection where the leftover funds can still buy a leftover item in the plan, and verify that the API returns a validation error. Correct the selection to be complete and verify it succeeds, triggers a delivery, and refunds the remainder.
