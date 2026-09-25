import { Link } from "react-router-dom";
import { Star, Clock, Heart } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import { Badge } from "../common/Badge";
import { useUserStore } from "../../store/userStore";
import { useLocationStore } from "../../store/locationStore";
import { cn } from "../../lib/utils";
import { estimateDeliveryEta, formatEtaRange, deliveryDistanceKm } from "../../lib/eta";
import { toast } from "sonner";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { user, isAuthenticated, toggleFavoriteRestaurant } = useUserStore();
  const isFavorite = user?.favoriteRestaurantIds.includes(restaurant.id) ?? false;

  const { latitude, longitude } = useLocationStore();
  const distance = deliveryDistanceKm(restaurant, { latitude, longitude });

  const eta = estimateDeliveryEta(restaurant, { distanceKm: distance });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to save favorites");
      return;
    }

    toggleFavoriteRestaurant(restaurant.id);
    toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="group block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow bg-lavender-50 dark:bg-gray-900"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Currently Closed</span>
          </div>
        )}

        {restaurant.isPromoted && (
          <Badge variant="warning" className="absolute top-2 left-2">
            Promoted
          </Badge>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 hover:scale-110 transition-transform"
          aria-label="Toggle favorite"
        >
          <Heart
            size={16}
            className={cn(
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
            )}
          />
        </button>

        {restaurant.offers && restaurant.offers.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
            <p className="text-white text-xs font-medium truncate">
              {restaurant.offers[0].description}
            </p>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shrink-0">
            <Star size={11} className="fill-white" />
            {restaurant.rating}
          </div>
        </div>

        {restaurant.source === "osm" && (
          <p className="text-[10px] font-medium text-primary-600 dark:text-primary-300 uppercase tracking-wide mt-1">
            Community mapped
          </p>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {restaurant.cuisines.join(", ")}
        </p>

        <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>₹{restaurant.costForTwo} for two</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {formatEtaRange(eta)}
            </span>
            <span className="text-xs text-gray-400">
              {distance} km
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}