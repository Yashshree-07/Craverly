import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin } from "lucide-react";
import {
  getWeather,
  getWeatherRecommendations,
  WEATHER_THEMES,
  type Weather,
} from "../../lib/weather";
import { useLocationStore } from "../../store/locationStore";
import { useCartStore } from "../../store/cartStore";
import { formatPrice } from "../../lib/utils";
import { toast } from "sonner";

export function WeatherPicks() {
  const { city, latitude, longitude, label: locationLabel } = useLocationStore();
  const addItem = useCartStore((state) => state.addItem);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getWeather(city, latitude, longitude)
      .then((result) => {
        if (cancelled) return;
        setWeather(result);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, latitude, longitude]);

  const picks = useMemo(
    () => (weather ? getWeatherRecommendations(weather) : []),
    [weather]
  );

  if (!isLoading && !weather) return null;

  const handleAdd = (
    itemId: string,
    restaurantId: string,
    name: string,
    price: number,
    vegType: "veg" | "non-veg" | "vegan"
  ) => {
    addItem({
      menuItemId: itemId,
      restaurantId,
      name,
      price,
      quantity: 1,
      vegType,
    });
    toast.success(`${name} added to cart`);
  };

  if (isLoading || !weather) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse h-24" />
      </div>
    );
  }

  const theme = WEATHER_THEMES[weather.condition];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-800 to-primary-900 p-5 sm:p-6 mb-4">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-4xl" aria-hidden>
            {theme.emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {theme.headline(weather.city)}
            </h2>
            <p className="text-sm text-white/70 mt-0.5 flex items-center gap-1">
              <MapPin size={13} /> {locationLabel()}
            </p>
            <p className="text-xs text-white/60 mt-1">{theme.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-3xl font-bold text-white">
                {weather.tempC}°
              </p>
              <p className="text-xs text-white/70">{weather.label}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · Open-Meteo
            </span>
          </div>
        </div>
      </div>

      {picks.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {picks.map((pick) => (
            <div
              key={pick.item.id}
              className="shrink-0 w-56 bg-lavender-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden snap-start"
            >
              <div className="relative h-32">
                {pick.item.image ? (
                  <img
                    src={pick.item.image}
                    alt={pick.item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40" />
                )}
                <Link
                  to={`/restaurant/${pick.restaurant.id}`}
                  className="absolute bottom-2 left-2 text-[11px] font-semibold bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300 hover:text-primary-600"
                >
                  {pick.restaurant.name}
                </Link>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {pick.item.name}
                  </p>
                  <button
                    onClick={() =>
                      handleAdd(
                        pick.item.id,
                        pick.restaurant.id,
                        pick.item.name,
                        pick.item.price,
                        pick.item.vegType
                      )
                    }
                    aria-label={`Add ${pick.item.name} to cart`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  {formatPrice(pick.item.price)}
                </p>

                {pick.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pick.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="text-[10px] font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}