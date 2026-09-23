import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "../types/order";
import {
  saveOrder,
  updateOrderStatusRemote,
} from "../lib/orderService";

interface OrderState {
  orders: Order[];
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  applyRemoteOrderStatus: (orderId: string, status: OrderStatus, timestamp: string) => void;
  mergeRemoteOrders: (orders: Order[]) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],

      placeOrder: (order) => {
        set({ orders: [order, ...get().orders] });
        void saveOrder(order);
      },

      updateOrderStatus: (orderId, status) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        const statusHistory = [
          ...order.statusHistory,
          { status, timestamp: new Date().toISOString() },
        ];

        set({
          orders: get().orders.map((o) =>
            o.id === orderId ? { ...o, status, statusHistory } : o
          ),
        });

        void updateOrderStatusRemote(orderId, status, statusHistory);
      },

      // Syncs an external (realtime) status change without re-writing it back.
      applyRemoteOrderStatus: (orderId, status, timestamp) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status === status) return;

        set({
          orders: get().orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  statusHistory: [...o.statusHistory, { status, timestamp }],
                }
              : o
          ),
        });
      },

      mergeRemoteOrders: (orders) => {
        if (orders.length === 0) return;
        const merged = [...orders];
        const knownIds = new Set(orders.map((o) => o.id));
        for (const order of get().orders) {
          if (!knownIds.has(order.id)) merged.push(order);
        }
        set({ orders: merged });
      },

      getOrderById: (orderId) => get().orders.find((o) => o.id === orderId),
    }),
    { name: "craverly-orders" }
  )
);