import { useEffect } from "react";
import type { OrderStatus, Order } from "../types/order";
import { useOrderStore } from "../store/orderStore";

const STATUS_SEQUENCE: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

// How long each stage takes in the simulation (ms) — kept short for demo purposes
const STAGE_DURATION = 8000;

// The kitchen starts preparing ~25 minutes before a scheduled slot.
export const PREP_WINDOW_MS = 25 * 60 * 1000;

// Demo cap: even a slot hours away never holds longer than this (ms) at "placed".
const MAX_HOLD_MS = 12000;

export function useOrderSimulation(order: Order | undefined) {
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled") {
      return;
    }

    const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
    const nextStatus = STATUS_SEQUENCE[currentIndex + 1];

    if (!nextStatus) return;

    const now = Date.now();
    let delay = STAGE_DURATION;

    // Scheduled deliveries don't progress immediately. They stay "placed"
    // until we're inside the prep window (capped for the demo), then run
    // through the normal pipeline toward the targeted slot.
    if (order.scheduledDeliveryTime) {
      const scheduled = new Date(order.scheduledDeliveryTime).getTime();
      const remaining = scheduled - now;

      if (currentIndex === 0 && remaining > PREP_WINDOW_MS) {
        delay = Math.max(3000, Math.min(remaining - PREP_WINDOW_MS, MAX_HOLD_MS));
      }
    }

    const timer = setTimeout(() => {
      updateOrderStatus(order.id, nextStatus);
    }, delay);

    return () => clearTimeout(timer);
  }, [order, updateOrderStatus]);
}