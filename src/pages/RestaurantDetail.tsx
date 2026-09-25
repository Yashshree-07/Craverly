import { useParams, Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Heart,
  ChevronLeft,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  getRestaurantById,
  getMenuByRestaurantId,
  mockRestaurants,
} from "../data/mockRestaurants";
import { MenuItemCard } from "../components/restaurant/MenuItemCard";
import { ReviewsList } from "../components/restaurant/ReviewsList";
import { VegIndicator } from "../components/common/Badge";
import { useUserStore } from "../store/userStore";
import { useReviewStore } from "../store/reviewStore";
import { useLocationStore } from "../store/locationStore";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { ALLERGENS, CALORIE_FILTERS, type Allergen } from "../lib/allergens";
import { estimateDeliveryEta, formatEtaRange, deliveryDistanceKm } from "../lib/eta";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const restaurant = useMemo(
    () => (id ? getRestaurantById(id) : undefined),
    [id]
  );
  const menuItems = useMemo(() => (id ? getMenuByRestaurantId(id) : []), [id]);
  const allReviews = useReviewStore((state) => state.reviews);
  const loadReviewsForRestaurant = useReviewStore(
    (state) => state.loadReviewsForRestaurant
  );
  const reviews = useMemo(
    () => allReviews.filter((review) => review.restaurantId === id),
    [allReviews, id]
  );

  const { user, isAuthenticated, toggleFavoriteRestaurant } = useUserStore();
  const { latitude, longitude } = useLocationStore();
  const distance = useMemo(
    () => (restaurant ? deliveryDistanceKm(restaurant, { latitude, longitude }) : 0),
    [latitude, longitude, restaurant]
  );
  const eta = useMemo(
    () => (restaurant ? estimateDeliveryEta(restaurant, { distanceKm: distance }) : undefined),
    [restaurant, distance]
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const { add: addRecentlyViewed } = useRecentlyViewed();

  // Track recent visits for the home page section
  useEffect(() => {
    if (restaurant) addRecentlyViewed(restaurant.id);
  }, [restaurant, addRecentlyViewed]);

  // Pull live reviews from Supabase when configured
  useEffect(() => {
    if (id) loadReviewsForRestaurant(id);
  }, [id, loadReviewsForRestaurant]);

  const categories = useMemo(
    () => Array.from(new Set(menuItems.map((item) => item.category))),
    [menuItems]
  );

  const filteredItems = useMemo(() => {
    const passesAllergenFilter = (item: typeof menuItems[number]) =>
      selectedAllergens.length === 0 ||
      !item.nutrition?.allergens.some((a) => selectedAllergens.includes(a as Allergen));

    const passesCalorieFilter = (item: typeof menuItems[number]) =>
      maxCalories === null ||
      item.nutrition?.calories === undefined ||
      item.nutrition.calories <= maxCalories;

    const base =
      activeCategory === "all"
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory);

    return base.filter((item) => passesAllergenFilter(item) && passesCalorieFilter(item));
  }, [menuItems, activeCategory, selectedAllergens, maxCalories]);

  const groupedItems = useMemo(() => {
    if (activeCategory === "all") {
      return categories
        .map((category) => ({
          category,
          items: filteredItems.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0);
    }
    return [{ category: activeCategory, items: filteredItems }];
  }, [categories, activeCategory, filteredItems]);

  const recommendations = useMemo(() => {
    if (!restaurant) return [];
    return mockRestaurants
      .filter((r) => r.id !== restaurant.id)
      .flatMap((r) =>
        getMenuByRestaurantId(r.id)
          .slice(0, 3)
          .map((item) => ({ item, restaurantName: r.name }))
      );
  }, [restaurant]);

  const ratingBreakdown = useMemo(() => {
    const count = restaurant?.ratingCount ?? 0;
    return [
      { stars: 5, count: Math.round(count * 0.7), pct: 70 },
      { stars: 4, count: Math.round(count * 0.2), pct: 20 },
      { stars: 3, count: Math.round(count * 0.05), pct: 5 },
      { stars: 2, count: Math.round(count * 0.03), pct: 3 },
      { stars: 1, count: Math.round(count * 0.02), pct: 2 },
    ];
  }, [restaurant]);

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

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
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
        <div className="bg-lavender-50 dark:bg-gray-950 -mt-10 relative rounded-t-2xl p-5 shadow-lg">
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

          <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 font-bold text-gray-900 dark:text-gray-100">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {restaurant.rating}
              </span>
              <span className="text-gray-500">{restaurant.ratingCount} ratings</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {ratingBreakdown.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-9 flex items-center gap-1 shrink-0">
                    <Star size={9} className="fill-gray-300 text-gray-300" />
                    {stars}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right shrink-0 text-gray-500">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {eta ? formatEtaRange(eta) : `${restaurant.deliveryTimeMinutes} min`}
            </span>
            <span>{distance.toFixed(1)} km</span>
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
            {restaurant.fssaiLicense && (
              <p className="text-xs text-gray-400">
                FSSAI license no: {restaurant.fssaiLicense}
              </p>
            )}
          </div>

          {restaurant.offers && restaurant.offers.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {restaurant.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="shrink-0 bg-peach-50 dark:bg-peach-900/20 border border-dashed border-peach-400 rounded-lg px-3 py-2"
                >
                  <p className="text-xs font-bold text-peach-700 dark:text-peach-400">
                    {offer.code}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {offer.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Link
            to={`/group-order?restaurant=${restaurant.id}`}
            className="mt-3 flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border border-primary-600 text-primary-600 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Users size={16} /> Order with friends (split the bill)
          </Link>
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

        {/* Allergen + calorie filters */}
        <div className="py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 mr-1 shrink-0">
              Avoid:
            </span>
            {ALLERGENS.map((allergen) => {
              const isActive = selectedAllergens.includes(allergen);
              return (
                <button
                  key={allergen}
                  onClick={() =>
                    setSelectedAllergens((prev) =>
                      isActive ? prev.filter((a) => a !== allergen) : [...prev, allergen]
                    )
                  }
                  aria-pressed={isActive}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs border transition-colors",
                    isActive
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {allergen}
                </button>
              );
            })}
            <span className="text-xs font-semibold text-gray-500 mx-1 shrink-0">
              Cal:
            </span>
            {CALORIE_FILTERS.map((filter) => {
              const isActive = maxCalories === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setMaxCalories(isActive ? null : filter.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs border transition-colors",
                    isActive
                      ? "bg-primary-600 text-white border-primary-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
            {(selectedAllergens.length > 0 || maxCalories !== null) && (
              <button
                onClick={() => {
                  setSelectedAllergens([]);
                  setMaxCalories(null);
                }}
                className="px-2 py-1 rounded-full text-xs text-primary-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Menu */}
        <div>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No items in this category.
            </p>
          ) : (
            groupedItems.map(({ category, items }) => {
              const isCollapsed = collapsedCategories.has(category);
              return (
                <div key={category} className="py-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between gap-3 py-3 text-left"
                  >
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {category}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      {items.length} item{items.length === 1 ? "" : "s"}
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform",
                          isCollapsed && "-rotate-90"
                        )}
                      />
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div>
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          restaurantId={restaurant.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              People usually also ordered
            </h2>
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
              {recommendations.map(({ item, restaurantName }) => (
                <div
                  key={item.id}
                  className="shrink-0 w-44 rounded-lg border border-gray-200 dark:border-gray-800 bg-lavender-50 dark:bg-gray-950 overflow-hidden"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-3">
                    <div className="flex items-center gap-1.5">
                      {item.vegType !== "non-veg" && (
                        <VegIndicator type={item.vegType} />
                      )}
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {restaurantName}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      ₹{item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <ReviewsList
          reviews={reviews}
          restaurantId={restaurant.id}
          averageRating={restaurant.rating}
          totalCount={restaurant.ratingCount}
        />
      </div>
    </div>
  );
}