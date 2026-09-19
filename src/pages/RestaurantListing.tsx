import { useMemo, useState, useEffect } from "react";
import { FilterBar } from "../components/restaurant/FilterBar";
import { RestaurantCard } from "../components/restaurant/RestaurantCard";
import { RestaurantCardSkeleton } from "../components/common/Skeleton";
import { useFilterStore } from "../store/filterStore";
import { mockRestaurants } from "../data/mockRestaurants";
import { useDebounce } from "../hooks/useDebounce";
import { SearchX } from "lucide-react";

export default function RestaurantListing() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    searchQuery,
    cuisines,
    minRating,
    vegType,
    hasOffers,
    sortBy,
  } = useFilterStore();

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = useMemo(() => {
    let results = [...mockRestaurants];

    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.cuisines.some((c) => c.toLowerCase().includes(query))
      );
    }

    // Cuisine filter
    if (cuisines.length > 0) {
      results = results.filter((r) =>
        r.cuisines.some((c) => cuisines.includes(c))
      );
    }

    // Rating filter
    if (minRating > 0) {
      results = results.filter((r) => r.rating >= minRating);
    }

    // Veg type filter
    if (vegType !== "all") {
      if (vegType === "veg" || vegType === "vegan") {
        results = results.filter((r) => r.vegOnly);
      } else {
        results = results.filter((r) => !r.vegOnly);
      }
    }

    // Offers filter
    if (hasOffers) {
      results = results.filter((r) => r.offers && r.offers.length > 0);
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "deliveryTime":
        results.sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes);
        break;
      case "costLowHigh":
        results.sort((a, b) => a.costForTwo - b.costForTwo);
        break;
      case "costHighLow":
        results.sort((a, b) => b.costForTwo - a.costForTwo);
        break;
      case "popularity":
      default:
        results.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    return results;
  }, [debouncedSearch, cuisines, minRating, vegType, hasOffers, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Restaurants {searchQuery && `matching "${searchQuery}"`}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {isLoading ? "Loading..." : `${filteredRestaurants.length} restaurants found`}
      </p>

      <FilterBar />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No restaurants found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Try adjusting your filters or search for something else.
          </p>
        </div>
      )}
    </div>
  );
}