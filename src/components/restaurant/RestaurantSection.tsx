import { Link } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import { RestaurantCard } from "./RestaurantCard";
import { RestaurantCardSkeleton } from "../common/Skeleton";
import { cn } from "../../lib/utils";

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
  const [featured, ...rest] = restaurants;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {featured && (
            <Link
              to={`/restaurant/${featured.id}`}
              className="group relative block rounded-2xl overflow-hidden mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <img
                src={featured.image}
                alt={featured.name}
                className="h-44 md:h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              <span className="absolute top-3 left-3 text-[11px] font-semibold text-primary-700 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full uppercase tracking-wide">
                Featured
              </span>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  {featured.name}
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  {featured.cuisines.join(" · ")}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white">
                  <span className="flex items-center gap-1 bg-green-600 px-1.5 py-0.5 rounded">
                    <Star size={12} className="fill-white" />
                    {featured.rating}
                  </span>
                  <span className="flex items-center gap-1 text-white/90">
                    <Clock size={13} />
                    {featured.deliveryTimeMinutes} min
                  </span>
                  <span className="text-white/90">₹{featured.costForTwo} for two</span>
                  <span
                    className={cn(
                      "text-white/90",
                      featured.isOpen ? "text-green-300" : "text-red-300"
                    )}
                  >
                    {featured.isOpen ? "Open now" : "Closed"}
                  </span>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {rest.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </>
      )}

      {!isLoading && restaurants.length === 0 && (
        <p className="text-gray-500 text-sm">No restaurants found.</p>
      )}
    </section>
  );
}