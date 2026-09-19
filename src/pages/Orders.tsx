import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useOrderStore } from "../store/orderStore";
import { OrderCard } from "../components/orders/OrderCard";
import { Button } from "../components/common/Button";
import { cn } from "../lib/utils";

type TabFilter = "all" | "active" | "past";

export default function Orders() {
  const orders = useOrderStore((state) => state.orders);
  const [tab, setTab] = useState<TabFilter>("all");

  const filteredOrders = useMemo(() => {
    if (tab === "active") {
      return orders.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      );
    }
    if (tab === "past") {
      return orders.filter(
        (o) => o.status === "delivered" || o.status === "cancelled"
      );
    }
    return orders;
  }, [orders, tab]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Your orders</h1>

      <div className="flex gap-2 mb-6">
        {(["all", "active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm border capitalize transition-colors",
              tab === t
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageSearch size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            No {tab !== "all" ? tab : ""} orders yet
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Hungry? Start browsing restaurants near you.
          </p>
          <Link to="/restaurants">
            <Button>Browse restaurants</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}