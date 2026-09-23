import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useOrderStore } from "../store/orderStore";
import type { OrderStatus } from "../types/order";

// Subscribes to live status updates from Supabase (Postgres changes) for a
// single order. Falls back to a no-op when Supabase isn't configured.
export function useOrderRealtime(orderId: string | undefined) {
  const applyRemoteOrderStatus = useOrderStore(
    (state) => state.applyRemoteOrderStatus
  );

  useEffect(() => {
    const client = supabase;
    if (!client || !orderId) return;

    const channel = client
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: string;
            updated_at?: string;
          };
          if (row.status) {
            applyRemoteOrderStatus(
              orderId,
              row.status as OrderStatus,
              row.updated_at ?? new Date().toISOString()
            );
          }
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [orderId, applyRemoteOrderStatus]);
}