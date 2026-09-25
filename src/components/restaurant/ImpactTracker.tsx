import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import { Flame, Clock, Wallet } from "lucide-react";
import { useOrderStore } from "../../store/orderStore";
import { formatPrice } from "../../lib/utils";

// ~40 min of cooking saved per delivered order.
const COOKING_MINUTES_PER_ORDER = 40;

export function ImpactTracker() {
  const orders = useOrderStore((state) => state.orders);

  const stats = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const thisMonth = orders.filter((o) => o.placedAt.slice(0, 7) === monthKey);
    const ordersThisMonth = thisMonth.length;
    const spentThisMonth = thisMonth.reduce((sum, o) => sum + o.totalAmount, 0);
    const hoursSaved = Math.round(
      (ordersThisMonth * COOKING_MINUTES_PER_ORDER) / 60
    );
    return { ordersThisMonth, spentThisMonth, hoursSaved };
  }, [orders]);

  const last14Days = useMemo(() => {
    const byDay = new Map<string, { count: number; spend: number }>();
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      byDay.set(date.toISOString().slice(0, 10), { count: 0, spend: 0 });
    }
    for (const order of orders) {
      const key = order.placedAt.slice(0, 10);
      const slot = byDay.get(key);
      if (slot) {
        slot.count += 1;
        slot.spend += order.totalAmount;
      }
    }
    return [...byDay.entries()].map(([key, { count, spend }]) => {
      const [, month, day] = key.split("-");
      return { day: `${Number(day)}/${Number(month)}`, orders: count, spend };
    });
  }, [orders]);

  const hasOrders = orders.length > 0;
  const count = stats.ordersThisMonth;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-lavender-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 shrink-0">
              <Flame size={20} />
            </span>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 leading-snug">
                {count > 0
                  ? `You've ordered ${count} time${count === 1 ? "" : "s"} this month`
                  : "Your food impact, at a glance"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {count > 0
                  ? `Saved ${stats.hoursSaved} hour${
                      stats.hoursSaved === 1 ? "" : "s"
                    } of cooking by ordering in`
                  : "Order once and watch your savings add up here"}
              </p>
            </div>
          </div>

          <Link
            to="/analytics"
            className="text-sm font-semibold text-primary-600 hover:underline shrink-0"
          >
            View full analytics →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <MiniStat
            icon={<Clock size={14} className="text-peach-500" />}
            label="Cooking hours saved"
            value={String(stats.hoursSaved)}
          />
          <MiniStat
            icon={<Flame size={14} className="text-primary-600" />}
            label="Spent this month"
            value={formatPrice(stats.spentThisMonth)}
          />
          <MiniStat
            icon={<Wallet size={14} className="text-green-600" />}
            label="Orders this month"
            value={String(count)}
          />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500">
              Orders · last 14 days
            </p>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last14Days}>
                <defs>
                  <linearGradient id="impactFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6354b8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6354b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value, name) => [
                    value,
                    name === "orders" ? "Orders" : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#6354b8"
                  strokeWidth={2}
                  fill="url(#impactFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!hasOrders && (
          <Link
            to="/restaurants"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Place your first order
          </Link>
        )}
      </div>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span className="text-[11px] font-medium truncate">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
        {value}
      </p>
    </div>
  );
}