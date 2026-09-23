import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { TrendingUp, Wallet, Receipt, Utensils } from "lucide-react";
import { useOrderStore } from "../store/orderStore";
import { formatPrice, formatDate } from "../lib/utils";

const CHART_COLORS = ["#6354b8", "#22c55e", "#8b5cf6", "#ef4444", "#06b6d4", "#eab308"];

const PAYMENT_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  cod: "Cash on delivery",
};

export default function Analytics() {
  const orders = useOrderStore((state) => state.orders);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "delivered");
    const totalSpent = completed.reduce((sum, o) => sum + o.totalAmount, 0);

    const itemCounts = new Map<string, { name: string; count: number }>();
    for (const order of completed) {
      for (const item of order.items) {
        const existing = itemCounts.get(item.menuItemId);
        if (existing) existing.count += item.quantity;
        else itemCounts.set(item.menuItemId, { name: item.name, count: item.quantity });
      }
    }
    const topDish = [...itemCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];

    return {
      orderCount: completed.length,
      totalSpent,
      avgOrder: completed.length ? Math.round(totalSpent / completed.length) : 0,
      topDish: topDish ? topDish[1].name : null,
    };
  }, [orders]);

  const ordersByDay = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const order of orders) {
      const day = order.placedAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day: formatDate(day), count }));
  }, [orders]);

  const spendByRestaurant = useMemo(() => {
    const byRest = new Map<string, number>();
    for (const order of orders) {
      byRest.set(
        order.restaurantName,
        (byRest.get(order.restaurantName) ?? 0) + order.totalAmount
      );
    }
    return [...byRest.entries()].map(([name, value]) => ({ name, value }));
  }, [orders]);

  const ordersByPayment = useMemo(() => {
    const byPayment = new Map<string, number>();
    for (const order of orders) {
      byPayment.set(order.paymentMethod, (byPayment.get(order.paymentMethod) ?? 0) + 1);
    }
    return [...byPayment.entries()].map(([method, count]) => ({
      name: PAYMENT_LABELS[method] ?? method,
      value: count,
    }));
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    }
    return [...counts.entries()].map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      count,
    }));
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Order analytics</h1>
        <p className="text-sm text-gray-500 mb-4">
          Place an order to see your spending insights here.
        </p>
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Utensils size={16} /> Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Your food analytics
      </h1>
      <p className="text-sm text-gray-500 mb-6">Insights from {orders.length} orders</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Receipt size={18} />}
          label="Delivered orders"
          value={String(stats.orderCount)}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label="Total spent"
          value={formatPrice(stats.totalSpent)}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Avg order value"
          value={formatPrice(stats.avgOrder)}
        />
        <StatCard
          icon={<Utensils size={18} />}
          label="Most ordered"
          value={stats.topDish ?? "—"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Orders over time */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Orders per day
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersByDay}>
                <defs>
                  <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6354b8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6354b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6354b8"
                  fill="url(#ordersFill)"
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by restaurant */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Spend by restaurant
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendByRestaurant}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {spendByRestaurant.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Payment methods
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByPayment}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {ordersByPayment.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Order status
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#22c55e" name="Orders" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 text-primary-600 mb-2">{icon}</div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}