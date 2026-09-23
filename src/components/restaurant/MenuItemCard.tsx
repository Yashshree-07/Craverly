import { useState } from "react";
import { Plus, Minus, Star, Heart, Flame } from "lucide-react";
import type { MenuItem } from "../../types/restaurant";
import { VegIndicator } from "../common/Badge";
import { formatPrice, cn } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import { CustomizationModal } from "./CustomizationModal";
import { toast } from "sonner";

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
}

export function MenuItemCard({ item, restaurantId }: MenuItemCardProps) {
  const [showCustomization, setShowCustomization] = useState(false);
  const { items, addItem, updateQuantity } = useCartStore();
  const { user, isAuthenticated, toggleFavoriteMenuItem } = useUserStore();

  const cartItem = items.find((i) => i.menuItemId === item.id);
  const quantity = cartItem?.quantity ?? 0;
  const isFavorite = user?.favoriteMenuItemIds.includes(item.id) ?? false;

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast.error("Please login to save favorite dishes");
      return;
    }
    toggleFavoriteMenuItem(item.id);
    toast.success(isFavorite ? "Removed from favorite dishes" : "Saved to favorite dishes");
  };

  const handleAdd = () => {
    if (item.customizations && item.customizations.length > 0) {
      setShowCustomization(true);
      return;
    }

    addItem({
      menuItemId: item.id,
      restaurantId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      vegType: item.vegType,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <VegIndicator type={item.vegType} />
            {item.isBestseller && (
              <span className="text-[10px] font-bold text-peach-600 uppercase tracking-wide">
                Bestseller
              </span>
            )}
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-1">
            {item.name}
          </h4>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
            {formatPrice(item.price)}
          </p>
          {item.rating && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {item.rating} ({item.ratingCount})
            </div>
          )}
          {item.nutrition && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-gray-500">
              {item.nutrition.calories !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Flame size={11} className="text-peach-500" />
                  {item.nutrition.calories} cal
                </span>
              )}
              {item.nutrition.allergens.length > 0 && (
                <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                  contains {item.nutrition.allergens.join(", ")}
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        <div className="relative shrink-0 w-28">
          <button
            onClick={handleFavoriteClick}
            className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm hover:scale-110 transition-transform"
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart
              size={14}
              className={cn(
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
              )}
            />
          </button>
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="w-28 h-24 rounded-lg object-cover"
              loading="lazy"
            />
          )}

          {!item.isAvailable ? (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-gray-800 text-gray-500 text-xs px-3 py-1 rounded-full whitespace-nowrap">
              Sold out
            </div>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-primary-600 text-primary-600 font-semibold text-sm px-5 py-1.5 rounded-lg shadow-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors whitespace-nowrap"
            >
              ADD
            </button>
          ) : (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-primary-600 text-white rounded-lg shadow-sm px-2 py-1.5">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="hover:scale-110 transition-transform"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-semibold w-3 text-center">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="hover:scale-110 transition-transform"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showCustomization && (
        <CustomizationModal
          item={item}
          restaurantId={restaurantId}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </>
  );
}