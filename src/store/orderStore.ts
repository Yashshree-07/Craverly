import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "../types/order";

interface OrderState {
  orders: Order[];
  placeOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],

      placeOrder: (order) => {
        set({ orders: [order, ...get().orders] });
      },

      updateOrderStatus: (orderId, status) => {
        set({
          orders: get().orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  statusHistory: [
                    ...o.statusHistory,
                    { status, timestamp: new Date().toISOString() },
                  ],
                }
              : o
          ),
        });
      },

      getOrderById: (orderId) => get().orders.find((o) => o.id === orderId),
    }),
    { name: "craverly-orders" }
  )
);