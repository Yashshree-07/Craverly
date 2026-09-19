import type { Restaurant } from "../../types/restaurant";
import { RestaurantCard } from "./RestaurantCard";
import { RestaurantCardSkeleton } from "../common/Skeleton";

interface RestaurantSectionProps {
  title: string;
  restaurants: Restaurant[];
  isLoading?: boolean;
}

export function RestaurantSection({
  title,
  restaurants,
  isLoading,
}: RestaurantSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))
          : restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
      </div>

      {!isLoading && restaurants.length === 0 && (
        <p className="text-gray-500 text-sm">No restaurants found.</p>
      )}
    </section>
  );
}