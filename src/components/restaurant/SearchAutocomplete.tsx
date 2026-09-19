import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, Utensils, Flame, Clock3, X } from "lucide-react";
import {
  getRestaurantById,
  mockMenuItems,
  mockRestaurants,
} from "../../data/mockRestaurants";
import { useDebounce } from "../../hooks/useDebounce";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { TRENDING_SEARCHES } from "../../data/locations";
import { cn } from "../../lib/utils";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showIcon?: boolean;
}

interface DishResult {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Search restaurants or dishes",
  className,
  inputClassName,
  showIcon = true,
}: SearchAutocompleteProps) {
  const navigate = useNavigate();
  const { recent, addRecent, removeRecent, clearRecent } = useRecentSearches();
  const [isFocused, setIsFocused] = useState(false);
  const debounced = useDebounce(value.trim(), 200);
  const blurTimer = useRef<number | null>(null);

  const restaurantResults = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return mockRestaurants
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => c.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [debounced]);

  const dishResults = useMemo<DishResult[]>(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return mockMenuItems
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      )
      .map((m) => ({
        id: m.id,
        name: m.name,
        restaurantId: m.restaurantId,
        restaurantName: getRestaurantById(m.restaurantId)?.name ?? "",
      }))
      .filter((d) => d.restaurantName)
      .slice(0, 4);
  }, [debounced]);

  const hasMatches = restaurantResults.length > 0 || dishResults.length > 0;
  const showDropdown =
    isFocused && (debounced ? hasMatches : recent.length > 0);

  const handleFocus = () => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimer.current = window.setTimeout(() => setIsFocused(false), 150);
  };

  const goToRestaurant = (restaurantId: string) => {
    navigate(`/restaurant/${restaurantId}`);
    setIsFocused(false);
  };

  const runSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    addRecent(q);
    onChange(q);
    onSubmit(q);
    setIsFocused(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        {showIcon && (
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full py-2.5 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none",
            showIcon ? "pl-10" : "pl-3",
            inputClassName
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden text-left">
          {debounced ? (
            <>
              {restaurantResults.length > 0 && (
                <div className="py-1">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Restaurants
                  </p>
                  {restaurantResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToRestaurant(r.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Store
                        size={16}
                        className="text-primary-600 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {r.name}
                        </span>
                        <span className="block text-xs text-gray-500 truncate">
                          {r.cuisines.join(", ")}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {dishResults.length > 0 && (
                <div className="py-1 border-t border-gray-100 dark:border-gray-800">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Dishes
                  </p>
                  {dishResults.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToRestaurant(d.restaurantId)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Utensils
                        size={16}
                        className="text-gray-400 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {d.name}
                        </span>
                        <span className="block text-xs text-gray-500 truncate">
                          from {d.restaurantName}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {!hasMatches && (
                <p className="px-3 py-3 text-sm text-gray-500">
                  No matches for "{debounced}"
                </p>
              )}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <div className="py-1">
                  <div className="flex items-center justify-between px-3 pt-2 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Recent searches
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[11px] text-primary-600 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {recent.map((q) => (
                    <div
                      key={q}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runSearch(q)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <Clock3
                          size={15}
                          className="text-gray-400 shrink-0"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {q}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(q)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                        aria-label={`Remove ${q} from recent searches`}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                  <Flame size={12} /> Trending
                </p>
                <div className="flex flex-wrap gap-2 px-3 pt-1">
                  {TRENDING_SEARCHES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => runSearch(t)}
                      className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}