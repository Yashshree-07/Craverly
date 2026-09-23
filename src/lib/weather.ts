import type { DishRecommendation } from "./recommendations";
import { mockRestaurants, getMenuByRestaurantId } from "../data/mockRestaurants";

export type WeatherCondition =
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "clear"
  | "cloudy"
  | "hot"
  | "cold";

export interface Weather {
  condition: WeatherCondition;
  code: number;
  label: string;
  tempC: number;
  city: string;
  fetchedAt: string;
}

// Open-Meteo is free and needs no API key. Chennnai used as an in-app default.
const DEFAULT_COORDS = { lat: 13.0827, lng: 80.2707 };

const CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Dense fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Rain showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

// WMO weather codes: https://open-meteo.com/en/docs
function classify(code: number, tempC: number): WeatherCondition {
  if (code === 0) return tempC >= 32 ? "hot" : tempC <= 18 ? "cold" : "clear";
  if (code >= 1 && code <= 3)
    return tempC >= 32 ? "hot" : tempC <= 18 ? "cold" : "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

export async function getWeather(
  city: string,
  latitude: number | null,
  longitude: number | null
): Promise<Weather | null> {
  const lat = latitude ?? DEFAULT_COORDS.lat;
  const lng = longitude ?? DEFAULT_COORDS.lng;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const current = data?.current;
    if (!current || typeof current.weather_code !== "number") return null;

    const code = current.weather_code;
    const tempC = Math.round(current.temperature_2m);

    return {
      condition: classify(code, tempC),
      code,
      label: CODE_LABELS[code] ?? "Weather",
      tempC,
      city,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

interface WeatherTheme {
  emoji: string;
  headline: (city: string) => string;
  subtitle: string;
}

export const WEATHER_THEMES: Record<WeatherCondition, WeatherTheme> = {
  rain: {
    emoji: "🌧️",
    headline: (city) => `It's raining in ${city} — here's comfort food near you`,
    subtitle: "Steaming curries, biryanis and pizza to ride out the rain.",
  },
  storm: {
    emoji: "⛈️",
    headline: (city) => `Storm outside in ${city} — stay in with comfort food`,
    subtitle: "Hearty favourites to keep the stormy vibes cozy.",
  },
  snow: {
    emoji: "🌨️",
    headline: (city) => `It's snowing in ${city} — warm up with something hearty`,
    subtitle: "Hot, soul-warming dishes for a cold one.",
  },
  fog: {
    emoji: "🌫️",
    headline: (city) => `Foggy in ${city} — cozy food near you`,
    subtitle: "Muggy weather calls for warm, comforting plates.",
  },
  cold: {
    emoji: "🥶",
    headline: (city) => `Chilly in ${city} — warm comfort food near you`,
    subtitle: "Hot curries and biryanis to beat the nip.",
  },
  hot: {
    emoji: "🥵",
    headline: (city) => `Beat the heat in ${city} — cool treats near you`,
    subtitle: "Refreshing desserts, shakes and healthy bowls.",
  },
  clear: {
    emoji: "☀️",
    headline: (city) => `Perfect weather in ${city} — trending near you`,
    subtitle: "Clear skies, great mood — see what's hot right now.",
  },
  cloudy: {
    emoji: "⛅",
    headline: (city) => `Cloudy in ${city} — cozy food near you`,
    subtitle: "A laid-back day calls for something comforting.",
  },
};

const CONDITION_CUISINES: Record<WeatherCondition, string[]> = {
  rain: [
    "North Indian",
    "Mughlai",
    "Biryani",
    "Pizza",
    "Pasta",
    "Noodles",
    "Chinese",
    "Fast Food",
  ],
  storm: ["North Indian", "Mughlai", "Biryani", "Pizza", "Pasta", "Fast Food"],
  snow: ["North Indian", "Mughlai", "Biryani", "Pasta", "Rajasthani", "Dim Sum"],
  cold: [
    "North Indian",
    "Mughlai",
    "Biryani",
    "Pasta",
    "South Indian",
    "Chettinad",
  ],
  hot: ["Desserts", "Bakery", "Healthy", "Salads", "Vegan"],
  clear: [],
  cloudy: [],
  fog: [],
};

const CONDITION_REASON: Record<WeatherCondition, string> = {
  rain: "Rainy-day favourite",
  storm: "Storm-safe pick",
  snow: "Snowy pick",
  fog: "Cozy classic",
  cold: "Warming dish",
  hot: "Beat the heat",
  clear: "Trending now",
  cloudy: "Cozy pick",
};

export function getWeatherRecommendations(
  weather: Weather,
  limit = 4
): DishRecommendation[] {
  const whitelist = CONDITION_CUISINES[weather.condition];
  const restaurants = whitelist.length
    ? mockRestaurants
        .filter((r) => r.cuisines.some((c) => whitelist.includes(c)))
        .sort((a, b) => b.rating - a.rating)
    : [...mockRestaurants].sort((a, b) => b.ratingCount - a.ratingCount);

  const results: DishRecommendation[] = [];

  for (const restaurant of restaurants) {
    for (const item of getMenuByRestaurantId(restaurant.id)) {
      if (!item.isAvailable) continue;
      if (!item.isBestseller && (item.rating ?? 0) < 4.2) continue;
      if (results.some((r) => r.item.id === item.id)) continue;

      results.push({
        item,
        restaurant,
        score:
          (item.rating ?? 0) +
          (item.isBestseller ? 1 : 0) +
          restaurant.rating,
        reasons: [
          item.isBestseller ? "Bestseller" : CONDITION_REASON[weather.condition],
        ],
      });

      if (results.length >= limit) return results;
    }
  }

  return results;
}