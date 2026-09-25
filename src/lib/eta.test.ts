import { describe, it, expect } from "vitest";
import {
  estimateDeliveryEta,
  trafficBufferMinutes,
  formatEtaRange,
  deliveryDistanceKm,
  MAX_DELIVERY_DISTANCE_KM,
} from "./eta";
import type { Restaurant } from "../types/restaurant";

const baseRestaurant: Restaurant = {
  id: "r9",
  name: "Test Kitchen",
  image: "img",
  cuisines: ["Pizza"],
  rating: 4.0,
  ratingCount: 10,
  costForTwo: 300,
  deliveryTimeMinutes: 25,
  distanceKm: 2,
  address: "x",
  area: "x",
  city: "Chennai",
  isOpen: true,
  openingHours: "10 AM - 10 PM",
  latitude: 13.08,
  longitude: 80.27,
};

describe("eta estimation", () => {
  it("is deterministic for the same inputs", () => {
    const now = new Date("2025-01-15T14:00:00");
    const a = estimateDeliveryEta(baseRestaurant, { now });
    const b = estimateDeliveryEta(baseRestaurant, { now });
    expect(a).toEqual(b);
  });

  it("includes prep, travel, traffic, and pickup", () => {
    const eta = estimateDeliveryEta(baseRestaurant, {
      now: new Date("2025-01-15T14:00:00"),
    });
    expect(eta.prepMinutes).toBeGreaterThan(0);
    expect(eta.travelMinutes).toBeGreaterThan(0);
    expect(eta.trafficMinutes).toBeGreaterThan(0);
    expect(eta.pickupMinutes).toBeGreaterThan(0);
    expect(eta.minutes).toBeCloseTo(
      eta.prepMinutes +
        eta.travelMinutes +
        eta.trafficMinutes +
        eta.pickupMinutes,
      -1
    );
  });

  it("grows with distance", () => {
    const now = new Date("2025-01-15T14:00:00");
    const near = estimateDeliveryEta(baseRestaurant, { now, distanceKm: 1 });
    const far = estimateDeliveryEta(baseRestaurant, { now, distanceKm: 15 });
    expect(far.minutes).toBeGreaterThan(near.minutes);
  });

  it("applies a bigger traffic buffer during dinner rush", () => {
    const lunch = trafficBufferMinutes(new Date("2025-01-15T12:00:00"));
    const dinner = trafficBufferMinutes(new Date("2025-01-15T19:00:00"));
    expect(dinner).toBeGreaterThan(lunch);
  });

  it("formats as a believable range", () => {
    const eta = estimateDeliveryEta(baseRestaurant, {
      now: new Date("2025-01-15T14:00:00"),
    });
    expect(formatEtaRange(eta)).toMatch(/^\d+–\d+ min$/);
  });

  it("clamps implausible distances so ETAs never reach hours", () => {
    const now = new Date("2025-01-15T14:00:00");
    const nearby = estimateDeliveryEta(baseRestaurant, { now, distanceKm: 1 });
    const crossCity = estimateDeliveryEta(baseRestaurant, { now, distanceKm: 534 });
    expect(crossCity.minutes).toBeLessThanOrEqual(60);
    expect(crossCity.minutes).toBeLessThanOrEqual(nearby.minutes + 45);
  });

  it("falls back to listing distance when user coords are far away", () => {
    // User located in Delhi, restaurant is in Chennai: cross-city distance is
    // nonsense for a delivery app, so use the restaurant's own listing distance.
    const km = deliveryDistanceKm(baseRestaurant, {
      latitude: 28.6,
      longitude: 77.2,
    });
    expect(km).toBe(baseRestaurant.distanceKm);
    expect(km).toBeLessThanOrEqual(MAX_DELIVERY_DISTANCE_KM);
  });

  it("caps same-city haversine distances at the service radius", () => {
    // ~15km away in the same city clamps to the delivery radius.
    const km = deliveryDistanceKm(baseRestaurant, {
      latitude: 13.08 + 0.1,
      longitude: 80.27 + 0.1,
    });
    expect(km).toBeLessThanOrEqual(MAX_DELIVERY_DISTANCE_KM);
  });
});