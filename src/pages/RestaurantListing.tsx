import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterBar } from "../components/restaurant/FilterBar";
import { RestaurantCard } from "../components/restaurant/RestaurantCard";
import { RestaurantCardSkeleton } from "../components/common/Skeleton";
import { Button } from "../components/common/Button";
import { useFilterStore } from "../store/filterStore";
import { useLocationStore } from "../store/locationStore";
import {
  mockRestaurants,
  getMenuByRestaurantId,
  allCuisines,
} from "../data/mockRestaurants";
import { TRENDING_SEARCHES } from "../data/locations";
import { useDebounce } from "../hooks/useDebounce";
import { estimateDeliveryEta, deliveryDistanceKm } from "../lib/eta";
import { SearchX, RotateCcw, Flame } from "lucide-react";

const PAGE_SIZE = 8;

export default function RestaurantListing() {
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchQuery,
    cuisines,
    minRating,
    vegType,
    hasOffers,
    priceRange,
    maxDeliveryTime,
    sortBy,
    setSearchQuery,
    setCuisines,
    setMinRating,
    setVegType,
    setHasOffers,
    setPriceRange,
    setMaxDeliveryTime,
    setSortBy,
    toggleCuisine,
    resetFilters,
  } = useFilterStore();

  const { latitude, longitude, city } = useLocationStore();

  // Hydrate filter state from shared URL query params (on first mount)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);

    const cuisinesParam = searchParams.get("cuisines");
    if (cuisinesParam) setCuisines(cuisinesParam.split(","));

    const minRatingParam = searchParams.get("minRating");
    if (minRatingParam) setMinRating(Number(minRatingParam));

    const vegParam = searchParams.get("veg");
    if (vegParam === "veg" || vegParam === "non-veg" || vegParam === "vegan") {
      setVegType(vegParam);
    }

    if (searchParams.get("offers") === "true") setHasOffers(true);

    const priceParam = searchParams.get("price");
    if (priceParam) {
      const [min, max] = priceParam.split(",").map(Number);
      if (!Number.isNaN(min) && !Number.isNaN(max)) setPriceRange([min, max]);
    }

    const deliveryParam = searchParams.get("delivery");
    if (deliveryParam) setMaxDeliveryTime(Number(deliveryParam));

    const sortParam = searchParams.get("sort");
    if (
      sortParam &&
      ["rating", "deliveryTime", "costLowHigh", "costHighLow", "popularity", "nearMe"].includes(sortParam)
    ) {
      setSortBy(sortParam as typeof sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync so filters are shareable
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (cuisines.length > 0) params.set("cuisines", cuisines.join(","));
    if (minRating > 0) params.set("minRating", String(minRating));
    if (vegType !== "all") params.set("veg", vegType);
    if (hasOffers) params.set("offers", "true");
    if (priceRange[0] !== 0 || priceRange[1] !== 2000) {
      params.set("price", `${priceRange[0]},${priceRange[1]}`);
    }
    if (maxDeliveryTime != null) params.set("delivery", String(maxDeliveryTime));
    if (sortBy !== "popularity") params.set("sort", sortBy);

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    cuisines,
    minRating,
    vegType,
    hasOffers,
    priceRange,
    maxDeliveryTime,
    sortBy,
    setSearchParams,
  ]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = useMemo(() => {
    // Scope the listing to the selected city so picking a location swaps results.
    let results = city
      ? mockRestaurants.filter((r) => r.city === city)
      : [...mockRestaurants];

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

    // Cost for two within the selected price range
    results = results.filter(
      (r) => r.costForTwo >= priceRange[0] && r.costForTwo <= priceRange[1]
    );

    // Delivery time filter
    if (maxDeliveryTime != null) {
      results = results.filter((r) => {
        const dist = deliveryDistanceKm(r, { latitude, longitude });
        return estimateDeliveryEta(r, { distanceKm: dist }).minutes <= maxDeliveryTime;
      });
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "deliveryTime":
        results.sort((a, b) => {
          const da = deliveryDistanceKm(a, { latitude, longitude });
          const db = deliveryDistanceKm(b, { latitude, longitude });
          return (
            estimateDeliveryEta(a, { distanceKm: da }).minutes -
            estimateDeliveryEta(b, { distanceKm: db }).minutes
          );
        });
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
              deliveryDistanceKm(a, { latitude, longitude }) -
              deliveryDistanceKm(b, { latitude, longitude })
          );
        }
        break;
      case "popularity":
      default:
        results.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    return results;
  }, [debouncedSearch, cuisines, minRating, vegType, hasOffers, priceRange, maxDeliveryTime, sortBy, latitude, longitude, city]);

  // Start from the top when the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, cuisines, minRating, vegType, hasOffers, priceRange, maxDeliveryTime, sortBy, latitude, longitude, city]);

  const visibleRestaurants = filteredRestaurants.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRestaurants.length;

  const hasAnyFilters =
    debouncedSearch.trim().length > 0 ||
    cuisines.length > 0 ||
    minRating > 0 ||
    vegType !== "all" ||
    hasOffers ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 2000 ||
    maxDeliveryTime != null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Restaurants {searchQuery && `matching "${searchQuery}"`}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {isLoading ? "Loading..." : `${filteredRestaurants.length} restaurants in ${city}`}
      </p>

      <FilterBar />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load more restaurants ({filteredRestaurants.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
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