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

export function useOrderSimulation(order: Order | undefined) {
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled") {
      return;
    }

    const currentIndex = STATUS_SEQUENCE.indexOf(order.status);
    const nextStatus = STATUS_SEQUENCE[currentIndex + 1];

    if (!nextStatus) return;

    const timer = setTimeout(() => {
      updateOrderStatus(order.id, nextStatus);
    }, STAGE_DURATION);

    return () => clearTimeout(timer);
  }, [order, updateOrderStatus]);
}