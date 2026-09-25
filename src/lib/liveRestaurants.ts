// Polite OpenStreetMap client for Craverly.
//
// Geocodes a city with Nominatim, then pulls real, community-mapped restaurant
// locations from the Overpass API. OSM only provides name / geometry / a few
// tags, so every other field (rating, pricing, delivery time, menu) is filled
// in deterministically via gap-fill so real places still look complete.
//
// Politeness rules:
//  - A descriptive User-Agent header + contact email on every request.
//  - Throttled so consecutive requests never trample the public APIs.
//  - Results cached in localStorage for 24h; never re-fetch on repeat visits.
//  - In-flight requests are de-duplicated (one request per city at a time).
//  - All failures degrade silently to an empty list.

import type { Restaurant } from "../types/restaurant";
import { registerLiveRestaurants } from "../data/liveCatalog";
import { mockRestaurants } from "../data/mockRestaurants";
import { haversineDistanceKm } from "./utils";

export const OSM_USER_AGENT =
  "CraverlyFoodDelivery/1.0 (educational demo; contact: dev@craverly.app)";
const CONTACT_EMAIL = "dev@craverly.app";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const OVERPASS_BASE = "https://overpass-api.de/api/interpreter";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = "craverly-osm-v1";
const NEGATIVE_TTL_MS = 10 * 60 * 1000; // failed lookups cool down briefly
const REQUEST_GAP_MS = 1100;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RESULTS = 12;
const SEARCH_RADIUS_M = 8000;

interface Coordinates {
  lat: number;
  lon: number;
}

interface CacheEntry {
  t: number;
  ttl: number;
  osm: boolean; // true only when the cached entries came from the OSM live APIs
  restaurants: Restaurant[];
}

const pool: Record<string, Promise<Restaurant[]> | undefined> = {};
let lastRequestAt = 0;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readCache(city: string): CacheEntry | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}:${city}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.t > entry.ttl) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(
  city: string,
  restaurants: Restaurant[],
  ttl: number,
  osm: boolean
): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}:${city}`,
      JSON.stringify({ t: Date.now(), ttl, osm, restaurants })
    );
  } catch {
    // Storage full / unavailable — caching is best-effort.
  }
}

async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const gap = Math.max(0, REQUEST_GAP_MS - (Date.now() - lastRequestAt));
  if (gap > 0) await new Promise((resolve) => setTimeout(resolve, gap));
  lastRequestAt = Date.now();
  return fn();
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": OSM_USER_AGENT, "Accept": "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OSM request failed with status ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeCity(city: string): Promise<Coordinates | null> {
  const url =
    `${NOMINATIM_BASE}?format=json&q=${encodeURIComponent(`${city}, India`)}` +
    `&limit=1&accept-language=en&email=${encodeURIComponent(CONTACT_EMAIL)}`;
  try {
    const data = (await throttled(() => fetchJson(url))) as
      | { lat: string; lon: string }[]
      | null;
    if (Array.isArray(data) && data.length > 0 && data[0]) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    }
  } catch {
    // Network / API hiccup — caller degrades to empty list.
  }
  return null;
}

interface OsmElement {
  type?: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const CUISINE_FALLBACK: Record<string, string> = {
  Chennai: "South Indian",
  Bengaluru: "South Indian",
  Mumbai: "North Indian",
  Delhi: "North Indian",
  Hyderabad: "Biryani",
  Pune: "Maharashtrian",
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function mapCuisineTokens(raw: string): string[] {
  const tokens = raw.toLowerCase().split(/[;,/&|]+/).map((t) => t.trim()).filter(Boolean);
  const cuisines: string[] = [];
  for (const token of tokens) {
    if (/pizza/.test(token)) cuisines.push("Pizza");
    else if (/chettinad/.test(token)) cuisines.push("Chettinad");
    else if (/biryani|dum/.test(token)) cuisines.push("Biryani");
    else if (/south.?indian|idli|dosa|tiffin|udupi/.test(token)) cuisines.push("South Indian");
    else if (/indian|north.?indian|curry|punjabi|tandoor|thali/.test(token)) cuisines.push("North Indian");
    else if (/chinese|indochinese|haka/.test(token)) cuisines.push("Chinese");
    else if (/maharashtrian|kolhapuri|vadapav|misal/.test(token)) cuisines.push("Maharashtrian");
    else if (/street.?food|chaat|panipuri/.test(token)) cuisines.push("Street Food");
    else if (/seafood|fish|prawn|coastal|kerala|mangalorean/.test(token)) cuisines.push("Seafood");
    else if (/fast.?food|burger|fries/.test(token)) cuisines.push("Fast Food");
    else if (/cafe|coffee|bakery|cake|dessert|ice.cream|patisserie/.test(token)) cuisines.push("Desserts");
    else if (/healthy|salad|vegan|juice|bowl/.test(token)) cuisines.push("Healthy");
    else if (/continental|italian|pasta|french|mexican|thai/.test(token)) cuisines.push("Continental");
  }
  return unique(cuisines).sort();
}

// Deterministic hash so gap-filled values are stable per OSM element across renders.
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const IMAGES = [
  "photo-1552566626-52f8b828add9",
  "photo-1555396273-367ea4eb4db5",
  "photo-1512621776951-a57141f2eefd",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1551024506-0bccd828d307",
  "photo-1568901346375-23c9450c58cd",
  "photo-1517248135467-4c7edcad34c4",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1600891964092-4316c288032e",
  "photo-1563245372-f21724e3856d",
];

const VEG_CUISINES = new Set(["South Indian", "Street Food", "Desserts", "Healthy"]);

function costForTwo(amenity: string | undefined, cuisines: string[]): number {
  if (amenity === "fast_food") return 220 + (hashString(cuisines.join("")) % 8) * 15;
  if (amenity === "cafe") return 320 + (hashString(cuisines.join("")) % 10) * 15;
  return 380 + (hashString(cuisines.join("")) % 14) * 20;
}

function elementToRestaurant(
  element: OsmElement,
  city: string,
  center: Coordinates
): Restaurant | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const lat = element.center?.lat ?? element.lat;
  const lon = element.center?.lon ?? element.lon;
  if (lat == null || lon == null) return null;

  const id = `osm-${element.type ?? "node"}-${element.id}`;
  const seed = hashString(id);
  const amenity = tags.amenity;
  const rawCuisine = tags.cuisine ?? tags.description ?? "";
  let cuisines = mapCuisineTokens(rawCuisine);
  if (cuisines.length === 0) cuisines = [CUISINE_FALLBACK[city] ?? "North Indian"];

  const distanceKm = round1(
    Math.max(0.3, haversineDistanceKm(center.lat, center.lon, lat, lon))
  );
  const deliveryTimeMinutes = Math.max(18, Math.round(16 + distanceKm * 2 + (seed % 6)));

  const suburb = tags["addr:suburb"] ?? tags["addr:district"] ?? "City Centre";
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(", ");
  const address = street ? `${street}, ${suburb}` : `${suburb}, ${city}`;

  const hasOffer = seed % 4 === 0;

  return {
    id,
    name,
    source: "osm",
    image: `https://images.unsplash.com/${IMAGES[seed % IMAGES.length]}?w=500`,
    cuisines,
    rating: round1(3.2 + (seed % 16) / 10),
    ratingCount: 40 + (seed % 1200),
    costForTwo: costForTwo(amenity, cuisines),
    deliveryTimeMinutes,
    distanceKm,
    address,
    area: suburb,
    city,
    isOpen: true,
    openingHours: tags.opening_hours ?? "11:00 AM - 11:00 PM",
    contact: tags.phone ?? undefined,
    vegOnly: cuisines.every((c) => VEG_CUISINES.has(c)) && seed % 3 === 0,
    latitude: round1(lat),
    longitude: round1(lon),
    offers: hasOffer
      ? [
          {
            id: `off-osm-${element.id}`,
            code: "FIRST50",
            description: "50% off up to ₹100 on your first order",
            discountType: "percentage",
            discountValue: 50,
            minOrderValue: 199,
            maxDiscount: 100,
          },
        ]
      : undefined,
  };
}

function dedupeAgainstCatalog(
  restaurants: Restaurant[],
  city: string
): Restaurant[] {
  const existingNames = new Set(
    mockRestaurants
      .filter((r) => r.city === city)
      .map((r) => r.name.toLowerCase().trim())
  );
  const seen = new Set<string>();
  return restaurants.filter((r) => {
    const key = r.name.toLowerCase().trim();
    if (existingNames.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchNearby(
  center: Coordinates,
  city: string
): Promise<Restaurant[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|fast_food|cafe|food_court)$"](around:${SEARCH_RADIUS_M},${center.lat},${center.lon});
      way["amenity"~"^(restaurant|fast_food|cafe|food_court)$"](around:${SEARCH_RADIUS_M},${center.lat},${center.lon});
    );
    out center tags ${MAX_RESULTS * 6};
  `;

  const data = (await throttled(() =>
    fetchJson(
      `${OVERPASS_BASE}?data=${encodeURIComponent(query)}`
    )
  )) as { elements?: OsmElement[] } | null;

  if (!data || !Array.isArray(data.elements)) return [];

  const restaurants = data.elements
    .map((element) => elementToRestaurant(element, city, center))
    .filter((r): r is Restaurant => r !== null);

  return dedupeAgainstCatalog(restaurants, city).slice(0, MAX_RESULTS);
}

export async function getLiveRestaurants(
  city: string,
  opts: { force?: boolean } = {}
): Promise<Restaurant[]> {
  const cached = opts.force ? null : readCache(city);
  if (cached) {
    if (cached.osm) registerLiveRestaurants(cached.restaurants);
    // Cached OSM list is empty (an earlier attempt found nothing): show the
    // synthetic nearby picks instead so the section is never blank.
    return cached.restaurants.length > 0 ? cached.restaurants : syntheticNearby(city);
  }

  if (pool[city]) return pool[city];

  pool[city] = (async () => {
    const fallback = syntheticNearby(city);
    try {
      const center = await geocodeCity(city);
      if (!center) {
        writeCache(city, fallback, NEGATIVE_TTL_MS, false);
        return fallback;
      }
      const restaurants = await fetchNearby(center, city);
      const resolved = restaurants.length > 0 ? restaurants : fallback;
      writeCache(city, resolved, restaurants.length > 0 ? CACHE_TTL_MS : NEGATIVE_TTL_MS, restaurants.length > 0);
      if (restaurants.length > 0) registerLiveRestaurants(resolved);
      return resolved;
    } catch {
      writeCache(city, fallback, NEGATIVE_TTL_MS, false);
      return fallback;
    } finally {
      delete pool[city];
    }
  })();

  return pool[city];
}

// Current-city restaurants from the synthetic catalog, ordered by distance for a
// believable "near you" feel. Used so the live section never renders empty.
function syntheticNearby(city: string): Restaurant[] {
  return [...mockRestaurants]
    .filter((r) => r.city === city && r.isOpen)
    .sort(
      (a, b) => a.distanceKm - b.distanceKm || b.ratingCount - a.ratingCount
    )
    .slice(0, 8);
}