import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, Star, Clock3 } from "lucide-react";
import type { Restaurant } from "../../types/restaurant";
import { useLocationStore } from "../../store/locationStore";
import { cn } from "../../lib/utils";
import { estimateDeliveryEta, formatEtaRange, deliveryDistanceKm } from "../../lib/eta";

interface FastestDeliveryProps {
  restaurants: Restaurant[];
}

function distanceFor(
  r: Restaurant,
  latitude: number | null,
  longitude: number | null
): number {
  return deliveryDistanceKm(r, { latitude, longitude });
}

export function FastestDelivery({ restaurants }: FastestDeliveryProps) {
  const { latitude, longitude } = useLocationStore();

  const fastest = useMemo(() => {
    return [...restaurants]
      .sort(
        (a, b) =>
          estimateDeliveryEta(a, { distanceKm: distanceFor(a, latitude, longitude) })
            .minutes -
          estimateDeliveryEta(b, { distanceKm: distanceFor(b, latitude, longitude) })
            .minutes
      )
      .slice(0, 6);
  }, [restaurants, latitude, longitude]);

  const quickest = fastest[0];

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap size={20} className="text-peach-500 fill-peach-500" />
            Breakfast, lunch & dinner — delivered fastest
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Live ETAs computed from prep time, distance & traffic.
          </p>
        </div>
        <Link
          to="/restaurants?sort=deliveryTime"
          className="hidden sm:inline-block text-sm font-semibold text-primary-600 hover:underline shrink-0"
        >
          See all →
        </Link>
      </div>

      {!quickest ? null : (
        <Link
          to={`/restaurant/${quickest.id}`}
          className="group block relative overflow-hidden rounded-2xl mb-4"
        >
          <img
            src={quickest.image}
            alt={quickest.name}
            className="h-40 md:h-56 w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-peach-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
            <Zap size={13} /> Fastest —{" "}
            {formatEtaRange(estimateDeliveryEta(quickest, { distanceKm: distanceFor(quickest, latitude, longitude) }))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-peach-300">
              Quickest in your area
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-0.5">
              {quickest.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/90">
              <span className="flex items-center gap-1 bg-green-600 px-1.5 py-0.5 rounded">
                <Star size={12} className="fill-white" />
                {quickest.rating}
              </span>
              <span className="flex items-center gap-1">
                <Clock3 size={14} />
{formatEtaRange(estimateDeliveryEta(quickest, { distanceKm: distanceFor(quickest, latitude, longitude) }))}
              </span>
              <span>{distanceFor(quickest, latitude, longitude).toFixed(1)} km</span>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {fastest.slice(1).map((r) => {
          const eta = estimateDeliveryEta(r, { distanceKm: distanceFor(r, latitude, longitude) });
          return (
            <Link
              key={r.id}
              to={`/restaurant/${r.id}`}
              className="group block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow bg-lavender-50 dark:bg-gray-900"
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={r.image}
                  alt={r.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-peach-100 dark:bg-peach-900/40 text-peach-700 dark:text-peach-400 px-2 py-0.5 text-[11px] font-bold">
                  <Clock3 size={11} /> {formatEtaRange(eta)}
                </span>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {r.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {r.cuisines.join(", ")}
                </p>
                <div
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    eta.minutes <= 25 ? "text-green-600" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {eta.minutes} min avg
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}