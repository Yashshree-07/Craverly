import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import { RestaurantCard } from "./RestaurantCard";
import { RestaurantCardSkeleton } from "../common/Skeleton";
import { getLiveRestaurants } from "../../lib/liveRestaurants";
import { useLocationStore } from "../../store/locationStore";

type Status = "loading" | "loaded" | "empty" | "idle";

// The homepage only teases the strip; the full list lives on /restaurants.
const PREVIEW_COUNT = 4;

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
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              <Link to="/restaurants" className="hover:text-primary-600 transition-colors">
                Live near you
              </Link>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Real places around you, plus popular nearby picks
            </p>
          </div>
          <Link
            to="/restaurants"
            className="hidden sm:inline-block text-sm font-semibold text-primary-600 hover:underline shrink-0"
          >
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (status === "empty") return null;

  const preview = restaurants.slice(0, PREVIEW_COUNT);
  const total = restaurants.length;

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            <Link to="/restaurants" className="hover:text-primary-600 transition-colors">
              Live near you
            </Link>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {area ? `${area}, ` : ""}
            {city}
            {total > preview.length && (
              <span className="text-gray-400 dark:text-gray-500">
                {" "}
                — showing {preview.length} of {total}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
            <MapPin size={13} />
            Near you
          </span>
          {total > preview.length && (
            <Link
              to="/restaurants"
              className="hidden sm:inline-block text-sm font-semibold text-primary-600 hover:underline"
            >
              See all →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {preview.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {total > preview.length && (
        <div className="flex justify-center mt-6 sm:hidden">
          <Link
            to="/restaurants"
            className="inline-block px-5 py-2.5 rounded-full border border-primary-500 text-primary-600 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          >
            See all {total} restaurants
          </Link>
        </div>
      )}
    </section>
  );
}