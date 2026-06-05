"use client";

import Link from "next/link";
import { Wallet, Clock, ShoppingBag, CheckCircle2, Package, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SellerStore, SellerOrder } from "@/types/seller";

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={accent ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className={`text-xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

export function DashboardStats({
  store, orders, ordersLoading,
}: { store: SellerStore; orders: SellerOrder[]; ordersLoading: boolean }) {
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === "accepted").length;
  const active = orders.filter((o) => o.status !== "accepted" && o.status !== "rejected").length;
  const recent = [...orders].slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Wallet className="size-5" />} label="Total earned" value={`₦${(store.totalEarned ?? 0).toLocaleString()}`} accent />
        <StatCard icon={<Clock className="size-5" />} label="Pending" value={`₦${(store.pendingBalance ?? 0).toLocaleString()}`} />
        <StatCard icon={<ShoppingBag className="size-5" />} label="Total orders" value={ordersLoading ? "—" : String(totalOrders)} />
        <StatCard icon={<CheckCircle2 className="size-5" />} label="Completed" value={ordersLoading ? "—" : String(completed)} />
        <StatCard icon={<Package className="size-5" />} label="Active orders" value={ordersLoading ? "—" : String(active)} />
        <StatCard icon={<Star className="size-5" />} label="Rating" value={`${store.averageRating?.toFixed(1) ?? "—"} (${store.ratingCount})`} />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/seller/orders" className="text-sm text-primary">View all</Link>
        </div>
        {ordersLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">No orders yet</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((o) => (
              <Link key={o.id} href="/seller/orders" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.status} · {o.items.length} item{o.items.length === 1 ? "" : "s"}</p>
                </div>
                <span className="text-sm font-semibold text-primary">₦{o.sellerAmount.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
