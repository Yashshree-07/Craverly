import { Link } from "react-router-dom";
import { Heart, Plus, UtensilsCrossed } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { mockRestaurants, mockMenuItems, getRestaurantById } from "../data/mockRestaurants";
import { RestaurantCard } from "../components/restaurant/RestaurantCard";
import { VegIndicator } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { formatPrice } from "../lib/utils";
import type { MenuItem, Restaurant } from "../types/restaurant";
import { toast } from "sonner";

export default function Favorites() {
  const { user, isAuthenticated } = useUserStore();
  const addItem = useCartStore((state) => state.addItem);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Your favorites</h1>
        <p className="text-sm text-gray-500 mb-4">
          Login to save restaurants and dishes you love.
        </p>
        <Link to="/login" state={{ from: "/favorites" }}>
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  const favoriteRestaurants = mockRestaurants.filter((r) =>
    user.favoriteRestaurantIds.includes(r.id)
  );

  const favoriteDishes = mockMenuItems
    .filter((m) => user.favoriteMenuItemIds.includes(m.id))
    .map((item) => ({
      item,
      restaurant: getRestaurantById(item.restaurantId),
    }))
    .filter(
      (d): d is { item: MenuItem; restaurant: Restaurant } =>
        Boolean(d.restaurant)
    );

  const isEmpty = favoriteRestaurants.length === 0 && favoriteDishes.length === 0;

  const handleAddToCart = (
    item: (typeof mockMenuItems)[number],
    restaurantName: string
  ) => {
    addItem({
      menuItemId: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      vegType: item.vegType,
    });
    toast.success(`${item.name} added to cart from ${restaurantName}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="text-red-500 fill-red-500" /> Your favorites
      </h1>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            Nothing saved yet
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Tap the heart on restaurants and dishes to save them here.
          </p>
          <Link to="/restaurants">
            <Button>Browse restaurants</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {favoriteRestaurants.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3">Restaurants</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {favoriteRestaurants.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            </section>
          )}

          {favoriteDishes.length > 0 && (
            <section>
              <h2 className="font-semibold mb-3 flex items-center gap-1.5">
                <UtensilsCrossed size={18} /> Dishes
              </h2>
              <div className="space-y-3">
                {favoriteDishes.map(({ item, restaurant }) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <VegIndicator type={item.vegType} />
                        <p className="font-medium text-sm truncate">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {restaurant.name}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link to={`/restaurant/${restaurant.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => handleAddToCart(item, restaurant.name)}>
                        <Plus size={14} /> Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}