"use client";

import useSWR from "swr";
import { nestMarketsApi } from "@/lib/nestmarkets-api";
import type { Cart, CartItem, MarketStoreLite } from "@/types/nestmarkets";

export const CART_KEY = "nestmarket-cart";

export function useCart() {
  const { data: res, error, isLoading, mutate } = useSWR(
    CART_KEY,
    () => nestMarketsApi.getCart(),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  );

  const cart: Cart | null = res?.data?.data ?? null;
  const items = cart?.items ?? [];
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const byStore = items.reduce<Record<string, { store: MarketStoreLite; items: CartItem[] }>>(
    (acc, item) => {
      const sid = item.product.storeId;
      if (!acc[sid]) acc[sid] = { store: item.product.store, items: [] };
      acc[sid].items.push(item);
      return acc;
    },
    {}
  );

  const add = async (productId: string, quantity: number) => {
    const r = await nestMarketsApi.addCartItem(productId, quantity);
    await mutate();
    return r;
  };
  const update = async (id: string, quantity: number) => {
    await mutate(
      (cur) =>
        cur?.data?.data
          ? { ...cur, data: { ...cur.data, data: { ...cur.data.data, items: cur.data.data.items.map((it) => (it.id === id ? { ...it, quantity } : it)) } } }
          : cur,
      { revalidate: false }
    );
    const r = await nestMarketsApi.updateCartItem(id, quantity);
    await mutate();
    return r;
  };
  const remove = async (id: string) => {
    await mutate(
      (cur) =>
        cur?.data?.data
          ? { ...cur, data: { ...cur.data, data: { ...cur.data.data, items: cur.data.data.items.filter((it) => it.id !== id) } } }
          : cur,
      { revalidate: false }
    );
    const r = await nestMarketsApi.removeCartItem(id);
    await mutate();
    return r;
  };

  return {
    cart, items, count, byStore,
    isLoading, error: !!(error || res?.error),
    add, update, remove, mutate,
  };
}
