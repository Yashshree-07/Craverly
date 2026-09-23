import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import {
  getDishRecommendations,
  getTrendingDishes,
  type DishRecommendation,
} from "../../lib/recommendations";
import { useUserStore } from "../../store/userStore";
import { useOrderStore } from "../../store/orderStore";
import { useCartStore } from "../../store/cartStore";
import { formatPrice } from "../../lib/utils";
import { toast } from "sonner";

export function PersonalizedPicks() {
  const user = useUserStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const addItem = useCartStore((state) => state.addItem);

  const hasHistory = orders.length > 0 || (user?.favoriteMenuItemIds.length ?? 0) > 0;
  const picks = useMemo(
    () =>
      hasHistory
        ? getDishRecommendations({ user, orders })
        : getTrendingDishes(),
    [user, orders, hasHistory]
  );

  if (picks.length === 0) return null;

  const handleAdd = (pick: DishRecommendation) => {
    addItem({
      menuItemId: pick.item.id,
      restaurantId: pick.restaurant.id,
      name: pick.item.name,
      price: pick.item.price,
      quantity: 1,
      vegType: pick.item.vegType,
    });
    toast.success(`${pick.item.name} added to cart`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {hasHistory ? "Made for you" : "Trending right now"}
        </h2>
        <span className="text-xs text-gray-400">
          {hasHistory ? "personalized picks" : "popular dishes"}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {picks.map((pick) => (
          <div
            key={pick.item.id}
            className="shrink-0 w-56 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden snap-start"
          >
            <div className="relative h-32">
              {pick.item.image ? (
                <img
                  src={pick.item.image}
                  alt={pick.item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40" />
              )}
              <Link
                to={`/restaurant/${pick.restaurant.id}`}
                className="absolute bottom-2 left-2 text-[11px] font-semibold bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300 hover:text-primary-600"
              >
                {pick.restaurant.name}
              </Link>
            </div>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {pick.item.name}
                </p>
                <button
onClick={() => handleAdd(pick)}
                  aria-label={`Add ${pick.item.name} to cart`}
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-0.5">{formatPrice(pick.item.price)}</p>

              {pick.reasons.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pick.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="text-[10px] font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}