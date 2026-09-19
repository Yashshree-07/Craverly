import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Star, Clock, MapPin, Phone, Heart, ChevronLeft } from "lucide-react";
import {
  getRestaurantById,
  getMenuByRestaurantId,
  getReviewsByRestaurantId,
} from "../data/mockRestaurants";
import { MenuItemCard } from "../components/restaurant/MenuItemCard";
import { ReviewsList } from "../components/restaurant/ReviewsList";
import { useUserStore } from "../store/userStore";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const restaurant = useMemo(
    () => (id ? getRestaurantById(id) : undefined),
    [id]
  );
  const menuItems = useMemo(() => (id ? getMenuByRestaurantId(id) : []), [id]);
  const reviews = useMemo(() => (id ? getReviewsByRestaurantId(id) : []), [id]);

  const { user, isAuthenticated, toggleFavoriteRestaurant } = useUserStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((item) => item.category))),
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return menuItems;
    return menuItems.filter((item) => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Restaurant not found</h1>
        <Link to="/restaurants" className="text-primary-600 underline mt-4 inline-block">
          Back to restaurants
        </Link>
      </div>
    );
  }

  const isFavorite = user?.favoriteRestaurantIds.includes(restaurant.id) ?? false;

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast.error("Please login to save favorites");
      return;
    }
    toggleFavoriteRestaurant(restaurant.id);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <div>
      {/* Cover image */}
      <div className="relative h-52 md:h-64 w-full overflow-hidden">
        <img
          src={restaurant.coverImage ?? restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <Link
          to="/restaurants"
          className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:scale-105 transition-transform"
        >
          <ChevronLeft size={20} />
        </Link>

        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 p-2 rounded-full hover:scale-105 transition-transform"
        >
          <Heart
            size={20}
            className={cn(isFavorite ? "fill-red-500 text-red-500" : "text-gray-700")}
          />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {/* Info card */}
        <div className="bg-white dark:bg-gray-950 -mt-10 relative rounded-t-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {restaurant.cuisines.join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2 py-1 rounded shrink-0">
              <Star size={13} className="fill-white" />
              {restaurant.rating}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {restaurant.deliveryTimeMinutes} min
            </span>
            <span>₹{restaurant.costForTwo} for two</span>
            <span
              className={cn(
                "font-medium",
                restaurant.isOpen ? "text-green-600" : "text-red-500"
              )}
            >
              {restaurant.isOpen ? "Open now" : "Closed"}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
            <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin size={14} /> {restaurant.address}, {restaurant.area}
            </p>
            {restaurant.contact && (
              <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={14} /> {restaurant.contact}
              </p>
            )}
            <p className="text-xs text-gray-400">{restaurant.openingHours}</p>
          </div>

          {restaurant.offers && restaurant.offers.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {restaurant.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="shrink-0 bg-primary-50 dark:bg-primary-900/20 border border-dashed border-primary-400 rounded-lg px-3 py-2"
                >
                  <p className="text-xs font-bold text-primary-700 dark:text-primary-400">
                    {offer.code}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {offer.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="sticky top-16 bg-white dark:bg-gray-950 z-10 flex items-center gap-2 overflow-x-auto py-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors",
              activeCategory === "all"
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 dark:border-gray-700"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors",
                activeCategory === cat
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 dark:border-gray-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu */}
        <div className="py-2">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No items in this category.
            </p>
          ) : (
            filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} restaurantId={restaurant.id} />
            ))
          )}
        </div>

        {/* Reviews */}
        <ReviewsList
          reviews={reviews}
          averageRating={restaurant.rating}
          totalCount={restaurant.ratingCount}
        />
      </div>
    </div>
  );
}