import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HeroSearch } from "../components/restaurant/HeroSearch";
import { CategoryTiles } from "../components/restaurant/CategoryTiles";
import { RestaurantSection } from "../components/restaurant/RestaurantSection";
import { FastestDelivery } from "../components/restaurant/FastestDelivery";
import { OfferCarousel } from "../components/restaurant/OfferCarousel";
import { ImpactTracker } from "../components/restaurant/ImpactTracker";
import { WeatherPicks } from "../components/restaurant/WeatherPicks";
import { PersonalizedPicks } from "../components/restaurant/PersonalizedPicks";
import { LiveRestaurants } from "../components/restaurant/LiveRestaurants";
import { mockRestaurants } from "../data/mockRestaurants";
import { useLocationStore } from "../store/locationStore";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { estimateDeliveryEta } from "../lib/eta";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { city, area } = useLocationStore();
  const { restaurants: recentlyViewed } = useRecentlyViewed();

  // Simulate initial data fetch for skeleton demo
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Every home section is scoped to the selected city so switching location
  // (Chennai, Delhi, Hyderabad, ...) swaps the whole homepage, not just the
  // "Live near you" strip.
  const cityRestaurants = useMemo(
    () => mockRestaurants.filter((r) => r.city === city),
    [city]
  );

  const topRated = [...cityRestaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const promoted = cityRestaurants.filter((r) => r.isPromoted);

  const fastDelivery = [...cityRestaurants]
    .sort(
      (a, b) =>
        estimateDeliveryEta(a).minutes - estimateDeliveryEta(b).minutes
    )
    .slice(0, 4);

  // Restaurants in the user's selected area (fallback: city)
  const popularInArea = useMemo(() => {
    const areaMatches = area
      ? mockRestaurants.filter((r) => r.area === area && r.city === city)
      : [];
    const cityMatches = mockRestaurants.filter((r) => r.city === city);
    const base = areaMatches.length > 0 ? areaMatches : cityMatches;

    return [...base]
      .sort((a, b) => b.ratingCount - a.ratingCount)
      .slice(0, 4);
  }, [city, area]);

  const popularInAreaTitle = area
    ? `Popular in ${area}`
    : `Popular in ${city}`;

  return (
    <div>
      <HeroSearch />

      <FastestDelivery restaurants={cityRestaurants} />

      <LiveRestaurants />

      <OfferCarousel />

      <ImpactTracker />

      <WeatherPicks />

      <PersonalizedPicks />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          What's on your mind?
        </h2>
        <CategoryTiles />

        <div className="mt-8 flex flex-col items-center">
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors group"
          >
            Browse all restaurants
            <ArrowRight size={16} className="text-peach-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="text-xs text-gray-500 mt-2">
            {cityRestaurants.length} restaurants in {city}
          </p>
        </div>
      </div>

      {recentlyViewed.length > 0 && (
        <RestaurantSection
          title="Recently viewed"
          restaurants={recentlyViewed}
          isLoading={isLoading}
        />
      )}

      <RestaurantSection
        title="Top rated near you"
        restaurants={topRated}
        isLoading={isLoading}
      />

      {promoted.length > 0 && (
        <RestaurantSection
          title="Featured offers"
          restaurants={promoted}
          isLoading={isLoading}
        />
      )}

      <RestaurantSection
        title={popularInAreaTitle}
        restaurants={popularInArea}
        isLoading={isLoading}
      />

      <RestaurantSection
        title="Fastest delivery"
        restaurants={fastDelivery}
        isLoading={isLoading}
      />
    </div>
  );
}