import Link from "next/link";
import { Package } from "lucide-react";

export function ChatOrderContext({
  order,
}: { order: { id: string; status: string } | null | undefined }) {
  if (!order) return null;
  return (
    <Link
      href="/marketplace/orders"
      className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs"
    >
      <Package className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">Order</span>
      <span className="font-medium">#{order.id.slice(0, 8)}</span>
      <span className="ml-auto capitalize rounded-full bg-card px-2 py-0.5 border border-border">{order.status}</span>
    </Link>
  );
}
