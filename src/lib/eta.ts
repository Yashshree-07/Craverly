import type { Restaurant } from "../types/restaurant";
import { haversineDistanceKm } from "./utils";

// Believable delivery ETA = prep time + (distance ÷ avg speed) + traffic buffer + pickup buffer.
// Deterministic per restaurant (seeded by id) so ETAs stay stable between renders.

export interface EtaOptions {
  distanceKm?: number; // overrides restaurant.distanceKm / haversine
  now?: Date;
}

// Delivery services only operate within a local radius. Anything beyond this is
// treated as "out of range" and clamped so ETAs never spiral into hours.
export const MAX_DELIVERY_DISTANCE_KM = 9;
const OUT_OF_SERVICE_AREA_KM = 30;

// Distance used for ETA + display. When the user's coordinates land far from the
// restaurant (e.g. they're browsing a different city entirely), we fall back to
// the listing distance instead of a non-sensical cross-city distance.
export function deliveryDistanceKm(
  restaurant: Restaurant,
  opts: { latitude?: number | null; longitude?: number | null } = {}
): number {
  const { latitude, longitude } = opts;
  if (latitude == null || longitude == null) return restaurant.distanceKm;
  const km = haversineDistanceKm(
    latitude,
    longitude,
    restaurant.latitude,
    restaurant.longitude
  );
  if (km > OUT_OF_SERVICE_AREA_KM) return restaurant.distanceKm;
  return Math.round(Math.min(km, MAX_DELIVERY_DISTANCE_KM) * 10) / 10;
}

export interface DeliveryEta {
  minutes: number; // best-guess single number (rounded)
  rangeMin: number; // believable window
  rangeMax: number;
  prepMinutes: number;
  travelMinutes: number;
  trafficMinutes: number;
  pickupMinutes: number;
}

const AVG_SPEED_KMH = 21;
const BASE_PREP_MIN = 6;
const DENSE_PREP_MIN = 14; // heavier cuisines need more kitchen time
const PICKUP_MIN = 3;

// Cuisines that generally take longer to plate (biryanis, thalis, baked goods).
const SLOW_CUISINES = new Set([
  "Biryani",
  "Mughlai",
  "Rajasthani",
  "Chettinad",
  "Desserts",
  "Bakery",
]);

// Deterministic pseudo-hash from a string, so the same restaurant always gets the same jitter.
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Extra minutes based on time of day (rush hours, weekends).
export function trafficBufferMinutes(now: Date): number {
  const h = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  // 1pm–3pm lunch rush, 6pm–9:30pm dinner rush
  const inLunchRush = h >= 13 && h <= 15;
  const inDinnerRush = h >= 18 && h <= 21;
  const inLateNight = h >= 23 || h <= 5;

  if (inDinnerRush) return isWeekend ? 7 : 9;
  if (inLunchRush) return isWeekend ? 4 : 6;
  if (inLateNight) return isWeekend ? 3 : 4;
  return 4;
}

export function estimatePrepMinutes(restaurant: Restaurant): number {
  const hash = hashId(restaurant.id);
  const jitter = hash % 5; // 0–4
  const hasSlowCuisine = restaurant.cuisines.some((c) => SLOW_CUISINES.has(c));
  return BASE_PREP_MIN + jitter + (hasSlowCuisine ? DENSE_PREP_MIN - BASE_PREP_MIN : 0);
}

export function estimatePickupMinutes(restaurant: Restaurant): number {
  return PICKUP_MIN + (hashId(restaurant.id) % 2); // 3–4
}

export function estimateDeliveryEta(
  restaurant: Restaurant,
  opts: EtaOptions = {}
): DeliveryEta {
  const now = opts.now ?? new Date();
  const distanceKm =
    opts.distanceKm == null
      ? restaurant.distanceKm
      : Math.min(opts.distanceKm, MAX_DELIVERY_DISTANCE_KM);

  const prep = estimatePrepMinutes(restaurant);
  const travel = (distanceKm / AVG_SPEED_KMH) * 60;
  const traffic = trafficBufferMinutes(now);
  const pickup = estimatePickupMinutes(restaurant);

  const raw = prep + travel + traffic + pickup;
  const minutes = Math.round(raw);
  const rangeMin = Math.max(5, Math.round(raw - 2));
  const rangeMax = Math.round(raw + 4);

  return {
    minutes,
    rangeMin,
    rangeMax,
    prepMinutes: Math.round(prep),
    travelMinutes: Math.round(travel),
    trafficMinutes: Math.round(traffic),
    pickupMinutes: pickup,
  };
}

export function formatEtaRange(eta: DeliveryEta): string {
  return `${eta.rangeMin}–${eta.rangeMax} min`;
}