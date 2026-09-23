import { useParams, Link } from "react-router-dom";
import { Phone, MessageCircle, ChevronLeft, Copy, Printer, CalendarClock } from "lucide-react";
import { useOrderStore } from "../store/orderStore";
import { useUserStore } from "../store/userStore";
import { useOrderSimulation } from "../hooks/useOrderSimulation";
import { useOrderRealtime } from "../hooks/useOrderRealtime";
import { OrderStatusTimeline } from "../components/orders/OrderStatusTimeline";
import { DeliveryMap } from "../components/orders/DeliveryMap";
import { formatPrice, formatDate } from "../lib/utils";
import { toast } from "sonner";

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrderStore((state) =>
    state.orders.find((o) => o.id === orderId)
  );
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useOrderSimulation(order);
  useOrderRealtime(orderId);

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

      {!isAuthenticated && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-400 mb-4">
          You're viewing this order as a guest.{" "}
          <Link
            to="/login"
            state={{ from: window.location.pathname }}
            className="underline font-medium"
          >
            Login
          </Link>{" "}
          to keep it in your order history.
        </div>
      )}

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

      {order.scheduledDeliveryTime && !isDelivered && (
        <div className="flex items-start gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-sm mb-6">
          <CalendarClock size={16} className="text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-primary-700 dark:text-primary-300">
              Scheduled for {formatScheduled(order.scheduledDeliveryTime)}
            </p>
            <p className="text-xs text-primary-600/70 dark:text-primary-300/70 mt-0.5">
              Your order is locked in — the kitchen will start preparing closer
              to your slot.
            </p>
          </div>
        </div>
      )}

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

      <div id="print-invoice" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-primary-600">Craverly</h3>
            <p className="text-xs text-gray-500">Tax invoice</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium print:hidden hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
          <p>
            <span className="block text-gray-400">Order ID</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.id}</span>
          </p>
          <p>
            <span className="block text-gray-400">Placed on</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(order.placedAt)}</span>
          </p>
          <p>
            <span className="block text-gray-400">Restaurant</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{order.restaurantName}</span>
          </p>
          <p>
            <span className="block text-gray-400">Payment</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {order.paymentMethod === "cod"
                ? "Cash on delivery"
                : order.paymentMethod.toUpperCase()}
            </span>
          </p>
        </div>

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

        <div className="space-y-1 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>GST (5%)</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Delivery fee</span>
            <span>{order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Packaging fee</span>
            <span>{formatPrice(order.packagingFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800">
            <span>Total paid</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">Delivering to</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {order.deliveryAddress.label} — {order.deliveryAddress.fullAddress}
          </p>
        </div>
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

function formatScheduled(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}