import { supabase } from "./supabaseClient";
import type {
  Order,
  OrderStatus,
  OrderStatusEvent,
  CartItem,
  Address,
} from "../types/order";

interface OrderRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_image: string | null;
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  packaging_fee: number;
  discount_amount: number;
  coupon_code: string | null;
  total_amount: number;
  delivery_address: Address;
  payment_method: Order["paymentMethod"];
  status: OrderStatus;
  status_history: OrderStatusEvent[];
  placed_at: string;
  estimated_delivery_time: string | null;
  scheduled_delivery_time: string | null;
  delivery_partner: Order["deliveryPartner"] | null;
}

function mapOrderToRow(order: Order) {
  return {
    id: order.id,
    user_id: order.userId,
    restaurant_id: order.restaurantId,
    restaurant_name: order.restaurantName,
    restaurant_image: order.restaurantImage,
    items: order.items,
    subtotal: order.subtotal,
    tax_amount: order.taxAmount,
    delivery_fee: order.deliveryFee,
    packaging_fee: order.packagingFee,
    discount_amount: order.discountAmount,
    coupon_code: order.couponCode ?? null,
    total_amount: order.totalAmount,
    delivery_address: order.deliveryAddress,
    payment_method: order.paymentMethod,
    status: order.status,
    status_history: order.statusHistory,
    placed_at: order.placedAt,
    estimated_delivery_time: order.estimatedDeliveryTime,
    scheduled_delivery_time: order.scheduledDeliveryTime ?? null,
    delivery_partner: order.deliveryPartner ?? null,
  };
}

function mapRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    restaurantImage: row.restaurant_image ?? "",
    items: row.items,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    deliveryFee: row.delivery_fee,
    packagingFee: row.packaging_fee,
    discountAmount: row.discount_amount,
    couponCode: row.coupon_code ?? undefined,
    totalAmount: row.total_amount,
    deliveryAddress: row.delivery_address,
    paymentMethod: row.payment_method,
    status: row.status,
    statusHistory: row.status_history,
    placedAt: row.placed_at,
    estimatedDeliveryTime: row.estimated_delivery_time ?? new Date().toISOString(),
    scheduledDeliveryTime: row.scheduled_delivery_time ?? undefined,
    deliveryPartner: row.delivery_partner ?? undefined,
  };
}

export async function saveOrder(order: Order): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("orders").insert(mapOrderToRow(order));
  if (error) {
    console.warn("saveOrder failed:", error.message);
  }
}

export async function updateOrderStatusRemote(
  orderId: string,
  status: OrderStatus,
  statusHistory: OrderStatusEvent[]
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      status_history: statusHistory,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) {
    console.warn("updateOrderStatusRemote failed:", error.message);
  }
}

export async function fetchOrders(userId: string): Promise<Order[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("placed_at", { ascending: false });
  if (error || !data) return [];
  return (data as OrderRow[]).map(mapRowToOrder);
}