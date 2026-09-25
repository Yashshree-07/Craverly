import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import { RestaurantCard } from "./RestaurantCard";
import { RestaurantCardSkeleton } from "../common/Skeleton";
import { getLiveRestaurants } from "../../lib/liveRestaurants";
import { useLocationStore } from "../../store/locationStore";

type Status = "loading" | "loaded" | "empty" | "idle";

export function LiveRestaurants() {
  const { city, area } = useLocationStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const requestedCity = useRef<string | null>(null);

  useEffect(() => {
    if (requestedCity.current === city) return;
    requestedCity.current = city;
    let cancelled = false;

    setStatus("loading");
    getLiveRestaurants(city)
      .then((live) => {
        if (cancelled) return;
        setRestaurants(live);
        setStatus(live.length > 0 ? "loaded" : "empty");
      })
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  if (status === "idle" || status === "loading") {
    return (
      <section className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Live near you
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Real places around you, plus popular nearby picks
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (status === "empty") return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Live near you
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {area ? `${area}, ` : ""}
            {city}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
          <MapPin size={13} />
          Near you
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </section>
  );
}