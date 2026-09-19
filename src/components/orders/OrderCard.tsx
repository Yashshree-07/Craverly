import { Link } from "react-router-dom";
import type { Order } from "../../types/order";
import { formatPrice, formatDate } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { useCartStore } from "../../store/cartStore";
import { toast } from "sonner";

interface OrderCardProps {
  order: Order;
}

const statusLabels: Record<Order["status"], string> = {
  placed: "Order placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusVariant: Record<Order["status"], "default" | "success" | "warning"> = {
  placed: "warning",
  confirmed: "warning",
  preparing: "warning",
  out_for_delivery: "warning",
  delivered: "success",
  cancelled: "default",
};

export function OrderCard({ order }: OrderCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleReorder = () => {
    order.items.forEach((item) => addItem(item));
    toast.success("Items added to cart from your previous order");
  };

  const isActive = order.status !== "delivered" && order.status !== "cancelled";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start gap-3">
        <img
          src={order.restaurantImage}
          alt={order.restaurantName}
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{order.restaurantName}</h3>
              <p className="text-xs text-gray-500">{formatDate(order.placedAt)}</p>
            </div>
            <Badge variant={statusVariant[order.status]}>
              {statusLabels[order.status]}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mt-1 truncate">
            {order.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
          </p>

          <div className="flex items-center justify-between mt-3">
            <span className="font-semibold text-sm">
              {formatPrice(order.totalAmount)}
            </span>
            <div className="flex gap-2">
              {isActive ? (
                <Link to={`/orders/${order.id}/track`}>
                  <Button size="sm">Track order</Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" onClick={handleReorder}>
                  Reorder
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}