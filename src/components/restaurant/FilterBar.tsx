import { useFilterStore } from "../../store/filterStore";
import { useLocationStore } from "../../store/locationStore";
import { allCuisines } from "../../data/mockRestaurants";
import { cn } from "../../lib/utils";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

const DEFAULT_PRICE_RANGE: [number, number] = [0, 2000];
const CUISINES_VISIBLE = 12;

export function FilterBar() {
  const {
    cuisines,
    minRating,
    vegType,
    hasOffers,
    sortBy,
    priceRange,
    maxDeliveryTime,
    toggleCuisine,
    setMinRating,
    setVegType,
    setHasOffers,
    setSortBy,
    setPriceRange,
    setMaxDeliveryTime,
    resetFilters,
  } = useFilterStore();

  const { latitude, longitude } = useLocationStore();
  const canUseNearMe = latitude != null && longitude != null;

  const [isOpen, setIsOpen] = useState(false);
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  const hasActiveFilters =
    cuisines.length > 0 ||
    minRating > 0 ||
    vegType !== "all" ||
    hasOffers ||
    priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    priceRange[1] !== DEFAULT_PRICE_RANGE[1] ||
    maxDeliveryTime != null;

  const activeFilterCount =
    cuisines.length +
    (minRating > 0 ? 1 : 0) +
    (vegType !== "all" ? 1 : 0) +
    (hasOffers ? 1 : 0) +
    (priceRange[0] !== DEFAULT_PRICE_RANGE[0] ||
    priceRange[1] !== DEFAULT_PRICE_RANGE[1]
      ? 1
      : 0) +
    (maxDeliveryTime != null ? 1 : 0);

  const priceTiers: { label: string; range: [number, number] }[] = [
    { label: "Under ₹300", range: [0, 300] },
    { label: "₹300–600", range: [300, 600] },
    { label: "₹600–1200", range: [600, 1200] },
    { label: "₹1200+", range: [1200, 2000] },
  ];

  const deliveryTiers = [30, 60];
  const isPriceActive = (range: [number, number]) =>
    priceRange[0] === range[0] && priceRange[1] === range[1];

  const handlePriceToggle = (range: [number, number]) => {
    if (isPriceActive(range)) {
      setPriceRange(DEFAULT_PRICE_RANGE);
    } else {
      setPriceRange(range);
    }
  };

  const handleDeliveryToggle = (minutes: number) => {
    setMaxDeliveryTime(maxDeliveryTime === minutes ? null : minutes);
  };

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    ...(canUseNearMe
      ? [{ value: "nearMe" as const, label: "Near me" }]
      : []),
    { value: "popularity", label: "Popularity" },
    { value: "rating", label: "Rating" },
    { value: "deliveryTime", label: "Delivery Time" },
    { value: "costLowHigh", label: "Cost: Low to High" },
    { value: "costHighLow", label: "Cost: High to Low" },
  ];

  const visibleCuisines = showAllCuisines
    ? allCuisines
    : allCuisines.slice(0, CUISINES_VISIBLE);

  return (
    <div className="mb-6">
      {/* Compact toolbar — toggle + sort, always visible */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors bg-white dark:bg-gray-900",
            isOpen || hasActiveFilters
              ? "border-primary-500 text-primary-700 dark:text-primary-300"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400"
          )}
        >
          <SlidersHorizontal size={16} />
          Filters
          <span
            className={cn(
              "min-w-5 h-5 px-1.5 rounded-full text-xs flex items-center justify-center transition-colors",
              hasActiveFilters
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            )}
          >
            {activeFilterCount}
          </span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </button>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
            Sort:
          </span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                sortBy === opt.value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              resetFilters();
              setShowAllCuisines(false);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      {isOpen && (
        <div className="mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <FilterGroup label="Dietary & quality">
            {(["all", "veg", "non-veg", "vegan"] as const).map((type) => (
              <Chip
                key={type}
                active={vegType === type}
                activeClasses="bg-green-600 text-white border-green-600"
                onClick={() => setVegType(type)}
              >
                {type === "all" ? "All" : type === "non-veg" ? "Non-veg" : type}
              </Chip>
            ))}
            <Chip
              active={minRating === 4}
              onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
            >
              4.0+ ★
            </Chip>
            <Chip active={hasOffers} onClick={() => setHasOffers(!hasOffers)}>
              Offers
            </Chip>
          </FilterGroup>

          <FilterGroup label="Price (for two)">
            {priceTiers.map((tier) => (
              <Chip
                key={tier.label}
                active={isPriceActive(tier.range)}
                onClick={() => handlePriceToggle(tier.range)}
              >
                {tier.label}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="Delivery time">
            {deliveryTiers.map((minutes) => (
              <Chip
                key={minutes}
                active={maxDeliveryTime === minutes}
                onClick={() => handleDeliveryToggle(minutes)}
              >
                ≤ {minutes} min
              </Chip>
            ))}
          </FilterGroup>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2.5">
              Cuisine
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {visibleCuisines.map((cuisine) => (
                <Chip
                  key={cuisine}
                  active={cuisines.includes(cuisine)}
                  activeClasses="bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100"
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </Chip>
              ))}
            </div>
            {allCuisines.length > CUISINES_VISIBLE && (
              <button
                onClick={() => setShowAllCuisines(!showAllCuisines)}
                className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {showAllCuisines
                  ? "Show less"
                  : `Show all ${allCuisines.length} cuisines`}
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform",
                    showAllCuisines && "rotate-180"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0 last:mb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2.5">
        {label}
      </p>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  activeClasses,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  activeClasses?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm border transition-colors",
        active
          ? activeClasses ?? "bg-primary-600 text-white border-primary-600"
          : "border-gray-300 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
    >
      {children}
    </button>
  );
}