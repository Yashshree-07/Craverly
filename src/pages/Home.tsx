import { useState, useEffect } from "react";
import { HeroSearch } from "../components/restaurant/HeroSearch";
import { CategoryTiles } from "../components/restaurant/CategoryTiles";
import { RestaurantSection } from "../components/restaurant/RestaurantSection";
import { mockRestaurants } from "../data/mockRestaurants";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data fetch for skeleton demo
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const topRated = [...mockRestaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const promoted = mockRestaurants.filter((r) => r.isPromoted);

  const fastDelivery = [...mockRestaurants]
    .sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes)
    .slice(0, 4);

  return (
    <div>
      <HeroSearch />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          What's on your mind?
        </h2>
        <CategoryTiles />
      </div>

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
        title="Fastest delivery"
        restaurants={fastDelivery}
        isLoading={isLoading}
      />
    </div>
  );
}