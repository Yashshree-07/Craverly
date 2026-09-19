import { useParams, Link } from "react-router-dom";
import { Phone, MessageCircle, ChevronLeft, Copy } from "lucide-react";
import { useOrderStore } from "../store/orderStore";
import { useOrderSimulation } from "../hooks/useOrderSimulation";
import { OrderStatusTimeline } from "../components/orders/OrderStatusTimeline";
import { DeliveryMap } from "../components/orders/DeliveryMap";
import { formatPrice, formatDate } from "../lib/utils";
import { toast } from "sonner";

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrderStore((state) =>
    state.orders.find((o) => o.id === orderId)
  );

  useOrderSimulation(order);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Link to="/orders" className="text-primary-600 underline mt-4 inline-block">
          View your orders
        </Link>
      </div>
    );
  }

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast.success("Order ID copied");
  };

  const isDelivered = order.status === "delivered";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeft size={16} /> Back to orders
      </Link>

      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold">
          {isDelivered ? "Order delivered!" : "Tracking your order"}
        </h1>
      </div>

      <button
        onClick={handleCopyOrderId}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        Order #{order.id} <Copy size={13} />
      </button>

      {!isDelivered && (
        <div className="mb-6">
          <DeliveryMap order={order} />
        </div>
      )}

      {order.deliveryPartner && !isDelivered && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-semibold">
              {order.deliveryPartner.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{order.deliveryPartner.name}</p>
              <p className="text-xs text-gray-500">Your delivery partner</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${order.deliveryPartner.phone}`}
              className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center"
            >
              <Phone size={16} />
            </a>
            <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center">
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <OrderStatusTimeline currentStatus={order.status} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <h3 className="font-semibold mb-3">Order details</h3>
        <div className="space-y-1.5 mb-3">
          {order.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {item.quantity} × {item.name}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-semibold text-sm pt-3 border-t border-gray-100 dark:border-gray-800">
          <span>Total paid</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {order.paymentMethod === "cod"
            ? "Cash on delivery"
            : `Paid via ${order.paymentMethod.toUpperCase()}`}{" "}
          • Placed {formatDate(order.placedAt)}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-semibold mb-2">Delivering to</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {order.deliveryAddress.label} — {order.deliveryAddress.fullAddress}
        </p>
      </div>
    </div>
  );
}