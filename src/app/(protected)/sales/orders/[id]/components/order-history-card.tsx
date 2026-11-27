"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionRole } from "@/lib/auth";
import { useOrderEvents } from "../hooks/use-order-events";
import { OrderHistoryRow } from "./order-history-row";

/** Lịch sử thao tác của đơn (`GET /orders/:id/events`), mới nhất trên cùng. */
export function OrderHistoryCard({ orderId, refreshKey }: { orderId: string; refreshKey: string }) {
  const { events, loading, error } = useOrderEvents(orderId, refreshKey);
  const role = getSessionRole();
  const newestFirst = [...events].reverse();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Lịch sử đơn hàng</CardTitle>
        {!loading && <Badge variant="outline">{events.length}</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : newestFirst.length === 0 ? (
          !error && <p className="py-4 text-center text-sm text-muted-foreground">Chưa có hoạt động nào</p>
        ) : (
          <ScrollArea className="max-h-[32rem] overflow-y-auto pr-3">
            <ol className="ml-1">
              {newestFirst.map((event) => (
                <OrderHistoryRow key={event.id} event={event} role={role} />
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
