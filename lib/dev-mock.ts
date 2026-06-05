/* eslint-disable @typescript-eslint/no-explicit-any */
// =====================================================================
// DEV MOCK — throwaway demo data so the NestMarkets UI can be viewed
// without a running backend. Enabled by NEXT_PUBLIC_MOCK=1 in .env.local.
// DO NOT COMMIT. Delete this file + the `// DEV MOCK` edits in lib/api.ts
// and remove NEXT_PUBLIC_MOCK from .env.local to turn it off.
// =====================================================================

export const MOCK_ENABLED = process.env.NEXT_PUBLIC_MOCK === "1";

const ME = "buyer-me";
const img = (seed: string, w = 400, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ---- Stores ---------------------------------------------------------
const stores = [
  { id: "st-1", ownerId: "owner-1", name: "Mama's Kitchen", description: "Home-cooked Nigerian meals & grains, freshly packed.", logoUrl: img("mama-logo", 100, 100), bannerUrl: img("mama-banner", 800, 240), averageRating: 4.8, ratingCount: 124, latitude: 6.45, longitude: 3.4, businessAddress: "12 Allen Ave, Ikeja", isVerified: true, status: "active", _count: { products: 6, followers: 312 } },
  { id: "st-2", ownerId: "owner-2", name: "FreshCo Groceries", description: "Fresh produce, drinks and household essentials.", logoUrl: img("fresh-logo", 100, 100), bannerUrl: img("fresh-banner", 800, 240), averageRating: 4.9, ratingCount: 88, latitude: 6.5, longitude: 3.37, businessAddress: "5 Adeniran Ogunsanya, Surulere", isVerified: true, status: "active", _count: { products: 6, followers: 540 } },
  { id: "st-3", ownerId: "owner-3", name: "Zobo Express", description: "Chilled zobo, smoothies and small chops.", logoUrl: img("zobo-logo", 100, 100), bannerUrl: img("zobo-banner", 800, 240), averageRating: 4.6, ratingCount: 41, latitude: 6.6, longitude: 3.35, businessAddress: "Lekki Phase 1", isVerified: true, status: "active", _count: { products: 4, followers: 96 } },
  { id: "st-4", ownerId: "owner-4", name: "Naija Snacks Hub", description: "Chin chin, plantain chips & more.", logoUrl: img("snack-logo", 100, 100), bannerUrl: img("snack-banner", 800, 240), averageRating: 4.4, ratingCount: 23, latitude: 6.43, longitude: 3.42, businessAddress: "Yaba", isVerified: true, status: "active", _count: { products: 5, followers: 60 } },
];

const lite = (s: any) => ({ id: s.id, name: s.name, logoUrl: s.logoUrl, averageRating: s.averageRating, ratingCount: s.ratingCount });

// ---- Products -------------------------------------------------------
const products = [
  // Mama's Kitchen (st-1) — prepared meals, rice, spices
  { id: "p-1", storeId: "st-1", name: "Party Jollof Combo", description: "Smoky party jollof with chicken & plantain. Serves 2.", price: 4500, imageUrl: img("jollof"), category: "Prepared Meals", stockLevel: 25, isActive: true, createdAt: "2026-05-20T10:00:00Z", store: lite(stores[0]) },
  { id: "p-2", storeId: "st-1", name: "Bag of Ofada Rice (5kg)", description: "Locally grown ofada rice.", price: 9000, imageUrl: img("ofada"), category: "Rice", stockLevel: 12, isActive: true, createdAt: "2026-05-19T10:00:00Z", store: lite(stores[0]) },
  { id: "p-8", storeId: "st-1", name: "Pepper Soup Spice Pack", description: "Ready-mix pepper soup seasoning.", price: 2000, imageUrl: img("spice"), category: "Spices", stockLevel: 50, isActive: true, createdAt: "2026-05-16T10:00:00Z", store: lite(stores[0]) },
  { id: "p-9", storeId: "st-1", name: "Egusi Soup (1L)", description: "Rich melon-seed soup with assorted meat.", price: 5500, imageUrl: img("egusi"), category: "Prepared Meals", stockLevel: 15, isActive: true, createdAt: "2026-05-15T10:00:00Z", store: lite(stores[0]) },
  { id: "p-10", storeId: "st-1", name: "Moi Moi (Pack of 4)", description: "Steamed bean pudding, freshly made.", price: 2400, imageUrl: img("moimoi"), category: "Prepared Meals", stockLevel: 30, isActive: true, createdAt: "2026-05-14T10:00:00Z", store: lite(stores[0]) },
  { id: "p-11", storeId: "st-1", name: "Honey Beans (2kg)", description: "Premium oloyin honey beans.", price: 3800, imageUrl: img("beans"), category: "Grains", stockLevel: 22, isActive: true, createdAt: "2026-05-13T10:00:00Z", store: lite(stores[0]) },

  // FreshCo Groceries (st-2) — produce, drinks, household
  { id: "p-3", storeId: "st-2", name: "Plantain Chips (Pack of 12)", description: "Crispy, lightly salted plantain chips.", price: 1200, imageUrl: img("plantain"), category: "Snacks", stockLevel: 80, isActive: true, createdAt: "2026-05-21T10:00:00Z", store: lite(stores[1]) },
  { id: "p-4", storeId: "st-2", name: "Fresh Tomato Basket", description: "Ripe tomatoes, ~3kg basket.", price: 3500, imageUrl: img("tomato"), category: "Produce", stockLevel: 0, isActive: true, createdAt: "2026-05-18T10:00:00Z", store: lite(stores[1]) },
  { id: "p-7", storeId: "st-2", name: "Carton of Eggs (30)", description: "Farm-fresh crate of eggs.", price: 5200, imageUrl: img("eggs"), category: "Produce", stockLevel: 18, isActive: true, createdAt: "2026-05-23T10:00:00Z", store: lite(stores[1]) },
  { id: "p-12", storeId: "st-2", name: "Red Palm Oil (2L)", description: "Pure unadulterated palm oil.", price: 3200, imageUrl: img("palmoil"), category: "Produce", stockLevel: 40, isActive: true, createdAt: "2026-05-12T10:00:00Z", store: lite(stores[1]) },
  { id: "p-13", storeId: "st-2", name: "Garri (4kg)", description: "Fine white garri, well processed.", price: 2800, imageUrl: img("garri"), category: "Grains", stockLevel: 60, isActive: true, createdAt: "2026-05-11T10:00:00Z", store: lite(stores[1]) },
  { id: "p-14", storeId: "st-2", name: "Yam Tuber (Large)", description: "Fresh puna yam, large size.", price: 4000, imageUrl: img("yam"), category: "Produce", stockLevel: 25, isActive: true, createdAt: "2026-05-10T10:00:00Z", store: lite(stores[1]) },
  { id: "p-15", storeId: "st-2", name: "Bottled Water (Pack of 12)", description: "Chilled table water.", price: 1500, imageUrl: img("water"), category: "Drinks", stockLevel: 100, isActive: true, createdAt: "2026-05-09T10:00:00Z", store: lite(stores[1]) },

  // Zobo Express (st-3) — drinks & small chops
  { id: "p-5", storeId: "st-3", name: "Chilled Zobo (1L)", description: "Hibiscus drink with pineapple & ginger.", price: 800, imageUrl: img("zobo"), category: "Drinks", stockLevel: 40, isActive: true, createdAt: "2026-05-22T10:00:00Z", store: lite(stores[2]) },
  { id: "p-16", storeId: "st-3", name: "Tigernut Drink (75cl)", description: "Creamy kunu aya, no preservatives.", price: 1000, imageUrl: img("tigernut"), category: "Drinks", stockLevel: 35, isActive: true, createdAt: "2026-05-08T10:00:00Z", store: lite(stores[2]) },
  { id: "p-17", storeId: "st-3", name: "Small Chops Platter", description: "Puff-puff, spring rolls & samosa. Serves 4.", price: 3500, imageUrl: img("smallchops"), category: "Snacks", stockLevel: 20, isActive: true, createdAt: "2026-05-07T10:00:00Z", store: lite(stores[2]) },
  { id: "p-18", storeId: "st-3", name: "Smoothie Pack (3x)", description: "Mixed fruit smoothies.", price: 2400, imageUrl: img("smoothie"), category: "Drinks", stockLevel: 18, isActive: true, createdAt: "2026-05-06T10:00:00Z", store: lite(stores[2]) },

  // Naija Snacks Hub (st-4) — snacks
  { id: "p-6", storeId: "st-4", name: "Chin Chin (500g)", description: "Crunchy sweet chin chin.", price: 1500, imageUrl: img("chinchin"), category: "Snacks", stockLevel: 33, isActive: true, createdAt: "2026-05-17T10:00:00Z", store: lite(stores[3]) },
  { id: "p-19", storeId: "st-4", name: "Kuli Kuli (300g)", description: "Spicy groundnut snack.", price: 900, imageUrl: img("kulikuli"), category: "Snacks", stockLevel: 45, isActive: true, createdAt: "2026-05-05T10:00:00Z", store: lite(stores[3]) },
  { id: "p-20", storeId: "st-4", name: "Coconut Candy (250g)", description: "Sweet toasted coconut bites.", price: 700, imageUrl: img("coconut"), category: "Snacks", stockLevel: 50, isActive: true, createdAt: "2026-05-04T10:00:00Z", store: lite(stores[3]) },
  { id: "p-21", storeId: "st-4", name: "Peanut Brittle (200g)", description: "Crunchy caramelised peanut bars.", price: 1100, imageUrl: img("peanut"), category: "Snacks", stockLevel: 0, isActive: true, createdAt: "2026-05-03T10:00:00Z", store: lite(stores[3]) },
  { id: "p-22", storeId: "st-4", name: "Dried Plantain (400g)", description: "Naturally sweet dried plantain.", price: 1300, imageUrl: img("driedplantain"), category: "Snacks", stockLevel: 28, isActive: true, createdAt: "2026-05-02T10:00:00Z", store: lite(stores[3]) },
];

const productById = (id: string) => products.find((p) => p.id === id);

// ---- In-memory cart (so add/update/remove work in the demo) ---------
let cartItems: any[] = [
  { id: "ci-1", cartId: "cart-1", productId: "p-1", quantity: 1, product: products[0] },
  { id: "ci-2", cartId: "cart-1", productId: "p-3", quantity: 2, product: products[2] },
  { id: "ci-3", cartId: "cart-1", productId: "p-5", quantity: 3, product: products[4] },
];
const cart = () => ({ id: "cart-1", buyerId: ME, items: cartItems });

// ---- Reviews (across multiple stores) -------------------------------
const reviews = [
  { id: "rv-1", orderId: "o-9", storeId: "st-1", rating: 5, review: "Best jollof in Lagos, delivery was fast!", createdAt: "2026-05-28T12:00:00Z", buyer: { fullName: "Ada O.", profilePhoto: img("ada", 80, 80) } },
  { id: "rv-2", orderId: "o-8", storeId: "st-1", rating: 4, review: "Tasty, portion could be bigger.", createdAt: "2026-05-26T09:00:00Z", buyer: { fullName: "Tunde B.", profilePhoto: null } },
  { id: "rv-3", orderId: "o-7", storeId: "st-1", rating: 5, review: null, createdAt: "2026-05-24T18:00:00Z", buyer: { fullName: "Ngozi", profilePhoto: img("ngozi", 80, 80) } },
  { id: "rv-4", orderId: "o-6", storeId: "st-2", rating: 5, review: "Fresh produce, exactly as pictured. Will reorder.", createdAt: "2026-05-27T11:00:00Z", buyer: { fullName: "Chidi N.", profilePhoto: img("chidi", 80, 80) } },
  { id: "rv-5", orderId: "o-5", storeId: "st-2", rating: 4, review: "Eggs arrived intact, good packaging.", createdAt: "2026-05-25T15:00:00Z", buyer: { fullName: "Funke A.", profilePhoto: null } },
  { id: "rv-6", orderId: "o-4", storeId: "st-3", rating: 5, review: "The zobo is so refreshing 🔥", createdAt: "2026-05-23T13:00:00Z", buyer: { fullName: "Emeka", profilePhoto: img("emeka", 80, 80) } },
  { id: "rv-7", orderId: "o-3", storeId: "st-3", rating: 4, review: "Small chops were a hit at my party.", createdAt: "2026-05-21T19:00:00Z", buyer: { fullName: "Lola", profilePhoto: null } },
  { id: "rv-8", orderId: "o-2", storeId: "st-4", rating: 4, review: "Chin chin is crunchy and not too sweet.", createdAt: "2026-05-20T09:00:00Z", buyer: { fullName: "Sola B.", profilePhoto: img("sola", 80, 80) } },
];

// ---- Orders ---------------------------------------------------------
const oItem = (p: any, qty: number) => ({ id: `oi-${p.id}-${qty}`, productId: p.id, quantity: qty, priceAtPurchase: p.price, product: p });
const orders = [
  { id: "o-1001", storeId: "st-1", buyerId: ME, totalAmount: 4500, deliveryFee: 800, adminFee: 225, sellerAmount: 4275, status: "paid", trackingStatus: "received", rejectionReason: null, addressSnapshot: { city: "Ikeja" }, createdAt: "2026-06-01T08:00:00Z", deliveredAt: null, acceptedAt: null, items: [oItem(products[0], 1)], store: lite(stores[0]), rating: null },
  { id: "o-1002", storeId: "st-2", buyerId: ME, totalAmount: 2400, deliveryFee: 600, adminFee: 120, sellerAmount: 2280, status: "paid", trackingStatus: "on_the_way", rejectionReason: null, addressSnapshot: { city: "Surulere" }, createdAt: "2026-05-31T14:00:00Z", deliveredAt: null, acceptedAt: null, items: [oItem(products[2], 2)], store: lite(stores[1]), rating: null },
  { id: "o-1003", storeId: "st-3", buyerId: ME, totalAmount: 2400, deliveryFee: 500, adminFee: 120, sellerAmount: 2280, status: "delivered", trackingStatus: "delivered", rejectionReason: null, addressSnapshot: { city: "Lekki" }, createdAt: "2026-05-30T10:00:00Z", deliveredAt: "2026-05-31T16:00:00Z", acceptedAt: null, items: [oItem(products[4], 3)], store: lite(stores[2]), rating: null },
  { id: "o-1004", storeId: "st-1", buyerId: ME, totalAmount: 9000, deliveryFee: 800, adminFee: 450, sellerAmount: 8550, status: "accepted", trackingStatus: "delivered", rejectionReason: null, addressSnapshot: { city: "Ikeja" }, createdAt: "2026-05-27T10:00:00Z", deliveredAt: "2026-05-28T12:00:00Z", acceptedAt: "2026-05-28T13:00:00Z", items: [oItem(products[1], 1)], store: lite(stores[0]), rating: { id: "rt-1", rating: 5, review: "Perfect" } },
  { id: "o-1005", storeId: "st-4", buyerId: ME, totalAmount: 1500, deliveryFee: 700, adminFee: 75, sellerAmount: 1425, status: "rejected", trackingStatus: "delivered", rejectionReason: "Package arrived damaged.", addressSnapshot: { city: "Yaba" }, createdAt: "2026-05-25T10:00:00Z", deliveredAt: "2026-05-26T12:00:00Z", acceptedAt: null, items: [oItem(products[5], 1)], store: lite(stores[3]), rating: null },
];

// ---- Chat -----------------------------------------------------------
const threadMsgs: Record<string, any[]> = {
  "th-1": [
    { id: "m-1", threadId: "th-1", senderId: "owner-1", content: "Hi! Your jollof order is being packed now. 🍚", isRead: false, createdAt: "2026-06-01T08:05:00Z", sender: { fullName: "Mama's Kitchen", profilePhoto: stores[0].logoUrl }, isSender: false },
    { id: "m-2", threadId: "th-1", senderId: ME, content: "Great, thank you! Roughly how long for delivery?", isRead: true, createdAt: "2026-06-01T08:06:00Z", sender: { fullName: "You", profilePhoto: null }, isSender: true },
    { id: "m-3", threadId: "th-1", senderId: "owner-1", content: "About 45 minutes. Rider is on the way soon.", isRead: false, createdAt: "2026-06-01T08:07:00Z", sender: { fullName: "Mama's Kitchen", profilePhoto: stores[0].logoUrl }, isSender: false },
  ],
  "th-2": [
    { id: "m-4", threadId: "th-2", senderId: ME, content: "Are the plantain chips fresh?", isRead: true, createdAt: "2026-05-31T13:50:00Z", sender: { fullName: "You", profilePhoto: null }, isSender: true },
    { id: "m-5", threadId: "th-2", senderId: "owner-2", content: "Yes, fried this morning! 😋", isRead: true, createdAt: "2026-05-31T13:55:00Z", sender: { fullName: "FreshCo Groceries", profilePhoto: stores[1].logoUrl }, isSender: false },
  ],
  // Seller-side threads (C3) — for the seller inbox at /seller/chat (storeId "my-st").
  // From the seller's perspective: the buyer's messages are inbound (isSender:false), mine outbound.
  "sth-1": [
    { id: "sm-1", threadId: "sth-1", senderId: "buyer-x", content: "Hi, is the jollof available for today?", isRead: false, createdAt: "2026-06-01T09:00:00Z", sender: { fullName: "Ada O.", profilePhoto: img("ada",80,80) }, isSender: false },
    { id: "sm-2", threadId: "sth-1", senderId: ME, content: "Yes! I can have it ready in an hour.", isRead: true, createdAt: "2026-06-01T09:02:00Z", sender: { fullName: "You", profilePhoto: null }, isSender: true },
  ],
  "sth-2": [
    { id: "sm-3", threadId: "sth-2", senderId: "buyer-y", content: "Please make the chips less salty 🙏", isRead: false, createdAt: "2026-05-31T15:00:00Z", sender: { fullName: "Tunde B.", profilePhoto: null }, isSender: false },
  ],
};
const lastMsg = (tid: string) => {
  const arr = threadMsgs[tid] || [];
  const m = arr[arr.length - 1];
  return m ? [{ id: m.id, content: m.content, senderId: m.senderId, isRead: m.isRead, createdAt: m.createdAt }] : [];
};
const threadSummaries = () => [
  { id: "th-1", orderId: "o-1001", buyerId: ME, storeId: "st-1", updatedAt: "2026-06-01T08:07:00Z", store: { name: stores[0].name, logoUrl: stores[0].logoUrl, ownerId: "owner-1" }, buyer: { fullName: "You", profilePhoto: null }, order: { id: "o-1001", status: "paid" }, messages: lastMsg("th-1"), unreadCount: 2 },
  { id: "th-2", orderId: "o-1002", buyerId: ME, storeId: "st-2", updatedAt: "2026-05-31T13:55:00Z", store: { name: stores[1].name, logoUrl: stores[1].logoUrl, ownerId: "owner-2" }, buyer: { fullName: "You", profilePhoto: null }, order: { id: "o-1002", status: "paid" }, messages: lastMsg("th-2"), unreadCount: 0 },
  // Seller-side threads for /seller/chat (storeId "my-st", owned by ME; buyer populated).
  { id: "sth-1", orderId: "so-1001", buyerId: "buyer-x", storeId: "my-st", updatedAt: "2026-06-01T09:02:00Z", store: { name: "Demo Store", logoUrl: img("mystore-logo",100,100), ownerId: ME }, buyer: { fullName: "Ada O.", profilePhoto: img("ada",80,80) }, order: { id: "so-1001", status: "paid" }, messages: lastMsg("sth-1"), unreadCount: 1 },
  { id: "sth-2", orderId: "so-1002", buyerId: "buyer-y", storeId: "my-st", updatedAt: "2026-05-31T15:00:00Z", store: { name: "Demo Store", logoUrl: img("mystore-logo",100,100), ownerId: ME }, buyer: { fullName: "Tunde B.", profilePhoto: null }, order: { id: "so-1002", status: "paid" }, messages: lastMsg("sth-2"), unreadCount: 1 },
];
const threadDetail = (id: string) => {
  const s = stores.find((x) => threadSummaries().find((t) => t.id === id)?.storeId === x.id) || stores[0];
  const ord = threadSummaries().find((t) => t.id === id)?.order ?? null;
  return { id, orderId: ord?.id ?? null, buyerId: ME, storeId: s.id, updatedAt: new Date().toISOString(), store: { name: s.name, logoUrl: s.logoUrl, ownerId: s.ownerId }, order: ord, messages: threadMsgs[id] || [] };
};

// ---- Delivery profiles (checkout) -----------------------------------
const zone = { id: "z-1", name: "Lagos Mainland", baseFee: 800, extraWeightFee: 0 };
const deliveryProfiles = [
  { id: "dp-1", profileId: ME, fullName: "Demo Buyer", phone: "08012345678", address: "23 Demo Street", city: "Ikeja", state: "Lagos", landmark: "Near the mall", notes: null, isDefault: true, deliveryZoneId: "z-1", deliveryZone: zone, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "dp-2", profileId: ME, fullName: "Demo Buyer (Office)", phone: "08087654321", address: "1 Office Plaza", city: "Victoria Island", state: "Lagos", landmark: null, notes: "Reception", isDefault: false, deliveryZoneId: "z-1", deliveryZone: zone, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
];

// ---- Profile --------------------------------------------------------
const profile = { profile: { id: ME, supabaseUserId: ME, fullName: "Demo Buyer", email: "demo@grownest.africa", profilePhoto: img("me", 80, 80), is2FAEnabled: true, hasPin: true }, balance: 125000, recentActivity: [] };

// ---- Seller store + my-products (C1) --------------------------------
// Mutable so create/edit/verify/CRUD demo flows persist for the session.
// Start with NO store so you see the create wizard first; set `myStore`
// to the commented object below if you'd rather start with a store.
// Seed a store so the C2 order board + earnings preview immediately.
// Flip this back to `null` (commented line below) to preview the C1 create-store flow.
let myStore: any = { id: "my-st", ownerId: ME, name: "Demo Store", description: "My demo shop", logoUrl: img("mystore-logo",100,100), bannerUrl: img("mystore-banner",800,240), isVerified: true, status: "active", latitude: null, longitude: null, averageRating: 4.7, ratingCount: 12, businessAddress: "12 Demo Rd, Lagos", cacNumber: "RC123456", verificationRequestedAt: "2026-05-20T00:00:00Z", createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-20T00:00:00Z", _count: { products: 3 }, pendingBalance: 15105, totalEarned: 42750 };
// let myStore: any = null;
let myProducts: any[] = [];

// Seller order board fixtures (C2)
const sellerOrders = [
  { id: "so-1001", buyerId: "buyer-x", storeId: "my-st", totalAmount: 4500, deliveryFee: 800, adminFee: 225, sellerAmount: 4275, status: "paid", trackingStatus: "received", addressSnapshot: { fullName: "Ada O.", city: "Ikeja", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-06-01T08:00:00Z", deliveredAt: null, acceptedAt: null, rejectedAt: null, items: [{ id: "soi-1", productId: "p-x", quantity: 1, priceAtPurchase: 4500, product: { id: "p-x", name: "Party Jollof Combo", imageUrl: img("jollof") } }] },
  { id: "so-1002", buyerId: "buyer-y", storeId: "my-st", totalAmount: 2400, deliveryFee: 600, adminFee: 120, sellerAmount: 2280, status: "paid", trackingStatus: "packaged", addressSnapshot: { fullName: "Tunde B.", city: "Surulere", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-05-31T14:00:00Z", deliveredAt: null, acceptedAt: null, rejectedAt: null, items: [{ id: "soi-2", productId: "p-y", quantity: 2, priceAtPurchase: 1200, product: { id: "p-y", name: "Plantain Chips", imageUrl: img("plantain") } }] },
  { id: "so-1003", buyerId: "buyer-z", storeId: "my-st", totalAmount: 9000, deliveryFee: 800, adminFee: 450, sellerAmount: 8550, status: "delivered", trackingStatus: "delivered", addressSnapshot: { fullName: "Ngozi", city: "Lekki", state: "Lagos" }, payoutStatus: "pending", rejectionReason: null, createdAt: "2026-05-30T10:00:00Z", deliveredAt: "2026-05-31T16:00:00Z", acceptedAt: null, rejectedAt: null, items: [{ id: "soi-3", productId: "p-z", quantity: 1, priceAtPurchase: 9000, product: { id: "p-z", name: "Ofada Rice 5kg", imageUrl: img("ofada") } }] },
  { id: "so-1004", buyerId: "buyer-w", storeId: "my-st", totalAmount: 1500, deliveryFee: 700, adminFee: 75, sellerAmount: 1425, status: "accepted", trackingStatus: "delivered", addressSnapshot: { fullName: "Bola", city: "Yaba", state: "Lagos" }, payoutStatus: "completed", rejectionReason: null, createdAt: "2026-05-27T10:00:00Z", deliveredAt: "2026-05-28T12:00:00Z", acceptedAt: "2026-05-28T13:00:00Z", rejectedAt: null, items: [{ id: "soi-4", productId: "p-w", quantity: 1, priceAtPurchase: 1500, product: { id: "p-w", name: "Chin Chin 500g", imageUrl: img("chinchin") } }] },
];
const sellerEarnings = { pendingBalance: 15105, totalEarned: 42750 };

const newStore = (over: any = {}) => ({ id: "my-st", ownerId: ME, name: "Demo Store", description: null, logoUrl: img("mystore-logo", 100, 100), bannerUrl: img("mystore-banner", 800, 240), isVerified: false, status: "pending", latitude: null, longitude: null, averageRating: 0, ratingCount: 0, businessAddress: null, cacNumber: null, verificationRequestedAt: null, createdAt: "2026-06-01T00:00:00Z", updatedAt: new Date().toISOString(), _count: { products: myProducts.length }, pendingBalance: sellerEarnings.pendingBalance, totalEarned: sellerEarnings.totalEarned, ...over });
const fdGet = (b: any, k: string) => (b && typeof b.get === "function" ? b.get(k) : b?.[k]);

// ---- Router ---------------------------------------------------------
const ok = (data: any) => ({ data, error: null, status: 200 });
const fail = (status: number, message: string) => ({ data: { success: false, message }, error: message, status });

export async function mockFetch(endpoint: string, method: string, body?: any): Promise<any> {
  const path = endpoint.split("?")[0];
  const q = endpoint.includes("?") ? new URLSearchParams(endpoint.split("?")[1]) : new URLSearchParams();
  const m = method.toUpperCase();

  // Auth / profile
  if (path.includes("/api/auth/profile")) return ok(profile);

  // ---- Seller: store (C1) ----
  if (path.endsWith("/nestmarkets/my-store") && m === "GET") {
    return myStore ? ok({ success: true, data: myStore }) : fail(404, "You do not have a store yet.");
  }
  if (path.endsWith("/nestmarkets/create-store") && m === "POST") {
    const pin = fdGet(body, "pin");
    if (pin && pin !== "1234") return fail(403, "Invalid transaction PIN."); // demo PIN is 1234
    myStore = newStore({ name: fdGet(body, "name") || "Demo Store", description: fdGet(body, "description") || null, businessAddress: fdGet(body, "businessAddress") || null });
    return ok({ success: true, data: myStore });
  }
  if (path.endsWith("/nestmarkets/my-store") && m === "PUT") {
    if (myStore) myStore = { ...myStore, name: fdGet(body, "name") ?? myStore.name, description: fdGet(body, "description") ?? myStore.description, businessAddress: fdGet(body, "businessAddress") ?? myStore.businessAddress, updatedAt: new Date().toISOString() };
    return ok({ success: true, message: "Updated", data: myStore });
  }
  if (path.endsWith("/nestmarkets/request-verification") && m === "POST") {
    if (myStore) myStore = { ...myStore, businessAddress: body?.businessAddress ?? myStore.businessAddress, cacNumber: body?.cacNumber ?? myStore.cacNumber, verificationRequestedAt: new Date().toISOString(), status: "pending" };
    return ok({ success: true, message: "Verification requested", data: myStore });
  }

  // ---- Seller: products (C1) ----
  if (path.endsWith("/nestmarkets/my-products") && m === "GET") return ok({ success: true, data: myProducts });
  if (path.endsWith("/nestmarkets/products") && m === "POST") {
    const p = { id: `mp-${Date.now()}`, storeId: myStore?.id ?? "my-st", name: fdGet(body, "name") || "New product", description: fdGet(body, "description") || null, price: Number(fdGet(body, "price")) || 0, imageUrl: img(`mp-${Date.now()}`), category: fdGet(body, "category") || null, stockLevel: parseInt(fdGet(body, "stockLevel") || "0", 10), isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    myProducts = [p, ...myProducts];
    if (myStore) myStore = { ...myStore, _count: { products: myProducts.length } };
    return ok({ success: true, data: p });
  }
  if (path.includes("/nestmarkets/products/") && m === "PUT") {
    const id = path.split("/products/")[1];
    myProducts = myProducts.map((p) => p.id === id ? { ...p, name: fdGet(body, "name") ?? p.name, description: fdGet(body, "description") ?? p.description, price: fdGet(body, "price") != null ? Number(fdGet(body, "price")) : p.price, category: fdGet(body, "category") ?? p.category, stockLevel: fdGet(body, "stockLevel") != null ? parseInt(fdGet(body, "stockLevel"), 10) : p.stockLevel, updatedAt: new Date().toISOString() } : p);
    return ok({ success: true, message: "Updated", data: myProducts.find((p) => p.id === id) });
  }
  if (path.includes("/nestmarkets/products/") && m === "DELETE") {
    const id = path.split("/products/")[1];
    myProducts = myProducts.filter((p) => p.id !== id);
    if (myStore) myStore = { ...myStore, _count: { products: myProducts.length } };
    return ok({ success: true, message: "Deleted" });
  }

  // ---- Seller: order board + earnings (C2) ----
  // Must match BEFORE the buyer `/stores/:id` detail/reviews handlers below.
  if (path.includes("/nestmarkets/stores/") && path.endsWith("/transactions") && m === "GET") {
    return ok({ success: true, data: sellerOrders, pagination: { total: sellerOrders.length, page: 1, limit: 50, pages: 1 } });
  }
  if (path.includes("/nestmarkets/orders/") && path.endsWith("/tracking") && m === "PATCH") {
    const id = path.split("/orders/")[1].replace("/tracking", "");
    const o = sellerOrders.find((x) => x.id === id);
    if (o) { o.trackingStatus = body?.status; if (body?.status === "delivered") o.status = "delivered"; }
    return ok({ success: true, data: o });
  }

  // Cart mutations + read
  if (path.endsWith("/nestmarkets/cart") && m === "GET") return ok({ success: true, data: cart() });
  if (path.endsWith("/nestmarkets/cart") && m === "DELETE") {
    const storeId = q.get("storeId");
    cartItems = storeId ? cartItems.filter((i) => i.product.storeId !== storeId) : [];
    return ok({ success: true, data: cart() });
  }
  if (path.endsWith("/cart/items") && m === "POST") {
    const p = productById(body?.productId);
    if (p) {
      const existing = cartItems.find((i) => i.productId === p.id);
      if (existing) existing.quantity += body.quantity ?? 1;
      else cartItems.push({ id: `ci-${Date.now()}`, cartId: "cart-1", productId: p.id, quantity: body.quantity ?? 1, product: p });
    }
    return ok({ success: true, data: cart() });
  }
  if (path.includes("/cart/items/") && m === "PATCH") {
    const id = path.split("/cart/items/")[1];
    const it = cartItems.find((i) => i.id === id);
    if (it) { if ((body?.quantity ?? 0) <= 0) cartItems = cartItems.filter((i) => i.id !== id); else it.quantity = body.quantity; }
    return ok({ success: true, data: cart() });
  }
  if (path.includes("/cart/items/") && m === "DELETE") {
    const id = path.split("/cart/items/")[1];
    cartItems = cartItems.filter((i) => i.id !== id);
    return ok({ success: true, data: cart() });
  }

  // Browse
  if (path.includes("/nestmarkets/browse")) {
    const search = (q.get("search") || "").toLowerCase();
    const category = q.get("category") || "";
    let list = products;
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search) || (p.description || "").toLowerCase().includes(search));
    if (category) list = list.filter((p) => p.category === category);
    return ok({ success: true, data: list, pagination: { total: list.length, page: 1, limit: 12, pages: 1 } });
  }

  // Orders
  if (path.includes("/nestmarkets/my-orders")) return ok({ success: true, data: orders, pagination: { total: orders.length, page: 1, limit: 10, pages: 1 } });
  if (path.includes("/orders/") && (path.endsWith("/accept") || path.endsWith("/reject") || path.endsWith("/rate")) && m === "POST")
    return ok({ success: true, message: "Done" });

  // Checkout
  if (path.endsWith("/nestmarkets/checkout") && m === "POST") { cartItems = []; return ok({ success: true, message: "Order placed", data: orders[0] }); }

  // Recommendations / stores / follow / reviews
  if (path.includes("/recommendations/top-rated")) return ok({ success: true, data: [...stores].sort((a, b) => b.averageRating - a.averageRating) });
  if (path.includes("/recommendations/nearby")) return ok({ success: true, data: stores.map((s, i) => ({ ...s, distance: 1.2 + i * 0.8 })) });
  if (path.endsWith("/followed-stores")) return ok({ success: true, data: [stores[0], stores[1]] });
  if (path.includes("/stores/") && path.endsWith("/follow") && m === "POST") return ok({ success: true, message: "Toggled", followed: true });
  if (path.includes("/stores/") && path.endsWith("/reviews")) {
    const sid = path.split("/stores/")[1].replace("/reviews", "");
    const list = reviews.filter((r) => r.storeId === sid);
    return ok({ success: true, data: list, pagination: { total: list.length, page: 1, limit: 10, pages: 1 } });
  }
  if (path.endsWith("/nestmarkets/stores")) return ok({ success: true, data: stores, total: stores.length });
  if (path.includes("/nestmarkets/stores/")) {
    const id = path.split("/stores/")[1];
    const s = stores.find((x) => x.id === id) || stores[0];
    return ok({ success: true, data: { ...s, products: products.filter((p) => p.storeId === s.id) } });
  }

  // Chat
  if (path.endsWith("/chat/threads") && m === "GET") return ok({ success: true, data: threadSummaries() });
  if (path.includes("/chat/threads/") && path.endsWith("/read") && m === "POST") {
    const id = path.split("/chat/threads/")[1].replace("/read", "");
    (threadMsgs[id] || []).forEach((msg) => { if (msg.senderId !== ME) msg.isRead = true; });
    return ok({ success: true });
  }
  if (path.includes("/chat/threads/") && path.endsWith("/messages") && m === "POST") {
    const id = path.split("/chat/threads/")[1].replace("/messages", "");
    const msg = { id: `m-${Date.now()}`, threadId: id, senderId: ME, content: body?.content ?? "", isRead: true, createdAt: new Date().toISOString(), sender: { fullName: "You", profilePhoto: null }, isSender: true };
    (threadMsgs[id] = threadMsgs[id] || []).push(msg);
    return ok({ success: true, data: msg });
  }
  if (path.includes("/chat/threads/") && m === "GET") {
    const id = path.split("/chat/threads/")[1];
    return ok({ success: true, data: threadDetail(id) });
  }

  // Delivery
  if (path.includes("/nesttrails/delivery-profiles")) return ok({ success: true, data: deliveryProfiles, default: deliveryProfiles[0], total: deliveryProfiles.length });
  if (path.includes("/nesttrails/zones")) return ok({ success: true, data: [zone] });

  // NestPurse transactions (payout history filters market_sale entries)
  if (path.includes("/api/nestpurse/transactions")) {
    return ok({
      transactions: [
        { id: "tx-1", type: "credit", amount: 4275, status: "success", method: "market_sale", reference: "MARKET_SALE_so-1004", date: "2026-05-28T13:00:00Z", narration: "Payout for order so-1004" },
        { id: "tx-2", type: "credit", amount: 8550, status: "success", method: "market_sale", reference: "MARKET_SALE_old", date: "2026-05-20T10:00:00Z", narration: "Payout for order so-0990" },
        { id: "tx-3", type: "debit", amount: 1000, status: "success", method: "nestmarkets_fee", reference: "STORE-CREATION", date: "2026-05-15T09:00:00Z", narration: "Store creation fee" },
      ],
      pagination: { hasMore: false, limit: 50 },
      filters: {},
    });
  }

  // Notifications (keep the shell happy)
  if (path.includes("/api/notifications")) return ok({ success: true, data: [], notifications: [], unread: 0, unreadCount: 0 });

  // Fallback — never break the UI
  return ok({ success: true, data: [] });
}
