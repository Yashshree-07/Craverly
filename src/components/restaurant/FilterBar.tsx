import { useFilterStore } from "../../store/filterStore";
import { allCuisines } from "../../data/mockRestaurants";
import { cn } from "../../lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export function FilterBar() {
  const {
    cuisines,
    minRating,
    vegType,
    hasOffers,
    sortBy,
    toggleCuisine,
    setMinRating,
    setVegType,
    setHasOffers,
    setSortBy,
    resetFilters,
  } = useFilterStore();

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    cuisines.length > 0 || minRating > 0 || vegType !== "all" || hasOffers;

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "popularity", label: "Popularity" },
    { value: "rating", label: "Rating" },
    { value: "deliveryTime", label: "Delivery Time" },
    { value: "costLowHigh", label: "Cost: Low to High" },
    { value: "costHighLow", label: "Cost: High to Low" },
  ];

  return (
    <div className="mb-6">
      {/* Mobile toggle */}
      <button
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium mb-3"
      >
        <SlidersHorizontal size={16} />
        Filters {hasActiveFilters && `(${cuisines.length + (minRating > 0 ? 1 : 0) + (vegType !== "all" ? 1 : 0) + (hasOffers ? 1 : 0)})`}
      </button>

      <div className={cn("space-y-4", !showMobileFilters && "hidden md:block")}>
        {/* Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Sort by:
          </span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                sortBy === opt.value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Veg type + rating + offers */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "veg", "non-veg", "vegan"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setVegType(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border capitalize transition-colors",
                vegType === type
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}

          <button
            onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              minRating === 4
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            4.0+ ★
          </button>

          <button
            onClick={() => setHasOffers(!hasOffers)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              hasOffers
                ? "bg-primary-600 text-white border-primary-600"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            Offers
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>

        {/* Cuisines */}
        <div className="flex items-center gap-2 flex-wrap">
          {allCuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => toggleCuisine(cuisine)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                cuisines.includes(cuisine)
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}