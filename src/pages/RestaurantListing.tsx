import { useMemo, useState, useEffect } from "react";
import { FilterBar } from "../components/restaurant/FilterBar";
import { RestaurantCard } from "../components/restaurant/RestaurantCard";
import { RestaurantCardSkeleton } from "../components/common/Skeleton";
import { useFilterStore } from "../store/filterStore";
import { useLocationStore } from "../store/locationStore";
import {
  mockRestaurants,
  getMenuByRestaurantId,
  allCuisines,
} from "../data/mockRestaurants";
import { TRENDING_SEARCHES } from "../data/locations";
import { useDebounce } from "../hooks/useDebounce";
import { haversineDistanceKm } from "../lib/utils";
import { SearchX, RotateCcw, Flame } from "lucide-react";

export default function RestaurantListing() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    searchQuery,
    cuisines,
    minRating,
    vegType,
    hasOffers,
    sortBy,
    setSearchQuery,
    toggleCuisine,
    resetFilters,
  } = useFilterStore();

  const { latitude, longitude } = useLocationStore();

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = useMemo(() => {
    let results = [...mockRestaurants];

    // Search filter — matches restaurant name, cuisines, AND dish names
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      results = results.filter((r) => {
        const matchesMeta =
          r.name.toLowerCase().includes(query) ||
          r.cuisines.some((c) => c.toLowerCase().includes(query));
        if (matchesMeta) return true;

        return getMenuByRestaurantId(r.id).some(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.description?.toLowerCase().includes(query)
        );
      });
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
      case "nearMe":
        if (latitude != null && longitude != null) {
          results.sort(
            (a, b) =>
              haversineDistanceKm(latitude, longitude, a.latitude, a.longitude) -
              haversineDistanceKm(latitude, longitude, b.latitude, b.longitude)
          );
        }
        break;
      case "popularity":
      default:
        results.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    return results;
  }, [debouncedSearch, cuisines, minRating, vegType, hasOffers, sortBy, latitude, longitude]);

  const hasAnyFilters =
    debouncedSearch.trim().length > 0 ||
    cuisines.length > 0 ||
    minRating > 0 ||
    vegType !== "all" ||
    hasOffers;

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchX size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No restaurants found
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            {hasAnyFilters
              ? "Try adjusting your filters or search for something else."
              : "Try searching for a dish or cuisine you're craving."}
          </p>

          <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-md">
            {hasAnyFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-colors"
              >
                <RotateCcw size={14} /> Clear all filters
              </button>
            )}

            <div className="w-full">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center justify-center gap-1">
                <Flame size={12} /> Try one of these
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {TRENDING_SEARCHES.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      resetFilters();
                      setSearchQuery(t);
                    }}
                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2 text-center">
                Or explore by cuisine
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {allCuisines.slice(0, 10).map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => {
                      setSearchQuery("");
                      toggleCuisine(cuisine);
                    }}
                    className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-colors"
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}