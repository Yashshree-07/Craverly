import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLiveRestaurants } from "./liveRestaurants";
import { getRestaurantById, getMenuByRestaurantId } from "../data/mockRestaurants";

const GEOCODE_FIXTURE = [
  { lat: "13.0836939", lon: "80.2701860", display_name: "Chennai, Tamil Nadu, India" },
];

const OVERPASS_FIXTURE = {
  elements: [
    {
      type: "node",
      id: 1001,
      lat: 13.09,
      lon: 80.28,
      tags: {
        name: "Madras Bhai Ka Dhaba",
        amenity: "restaurant",
        cuisine: "biryani;north_indian",
      },
    },
    {
      type: "node",
      id: 1002,
      lat: 13.1,
      lon: 80.3,
      tags: {
        name: "Tangerine Café",
        amenity: "cafe",
        cuisine: "cafe;coffee",
        "addr:suburb": "Adyar",
        "addr:street": "Lattice Bridge Road",
      },
    },
    {
      // Existing catalog restaurant in Chennai -> must be deduped away.
      type: "node",
      id: 1003,
      lat: 13.08,
      lon: 80.27,
      tags: { name: "Spice Symphony", amenity: "restaurant", cuisine: "indian" },
    },
    {
      // Unnamed -> must be dropped before enrichment.
      type: "node",
      id: 1004,
      lat: 13.05,
      lon: 80.25,
      tags: { amenity: "restaurant" },
    },
    {
      type: "way",
      id: 2001,
      center: { lat: 13.07, lon: 80.26 },
      tags: { name: "Coastal Catch", amenity: "restaurant", cuisine: "seafood;fish" },
    },
  ],
};

function mockFetch() {
  return vi.fn(async (url: string | URL | Request) => {
    const href = String(url);
    if (href.includes("nominatim")) {
      return {
        ok: true,
        status: 200,
        json: async () => GEOCODE_FIXTURE,
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => OVERPASS_FIXTURE,
    } as unknown as Response;
  });
}

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  });
}

describe("liveRestaurants (OSM)", () => {
  let fetchMock: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    stubLocalStorage();
  });

  it("enriches real OSM elements into complete restaurants", async () => {
    const restaurants = await getLiveRestaurants("Chennai");

    // Catalog match "Spice Symphony" is deduped; unnamed element dropped.
    const names = restaurants.map((r) => r.name);
    expect(names).not.toContain("Spice Symphony");

    const dhaba = restaurants.find((r) => r.id === "osm-node-1001");
    expect(dhaba).toBeDefined();
    expect(dhaba?.source).toBe("osm");
    expect(dhaba?.cuisines).toContain("Biryani");
    expect(dhaba?.cuisines).toContain("North Indian");
    expect(dhaba?.city).toBe("Chennai");
    expect(dhaba?.rating).toBeGreaterThanOrEqual(3.2);
    expect(dhaba?.isOpen).toBe(true);
    expect(typeof dhaba?.costForTwo).toBe("number");
    expect(typeof dhaba?.deliveryTimeMinutes).toBe("number");

    const cafe = restaurants.find((r) => r.id === "osm-node-1002");
    expect(cafe?.area).toBe("Adyar");
    expect(cafe?.address).toContain("Lattice Bridge Road");

    const coastal = restaurants.find((r) => r.id === "osm-way-2001");
    expect(coastal?.cuisines).toContain("Seafood");
  });

  it("registers live restaurants so detail pages and menus resolve", async () => {
    await getLiveRestaurants("Chennai");

    const restaurant = getRestaurantById("osm-node-1001");
    expect(restaurant?.name).toBe("Madras Bhai Ka Dhaba");

    const menu = getMenuByRestaurantId("osm-node-1001");
    expect(menu.length).toBeGreaterThanOrEqual(15);
    expect(menu.every((m) => m.restaurantId === "osm-node-1001")).toBe(true);
  });

  it("de-duplicates concurrent requests and serves from cache afterwards", async () => {
    const [first, second] = await Promise.all([
      getLiveRestaurants("Chennai"),
      getLiveRestaurants("Chennai"),
    ]);
    expect(first).toHaveLength(second.length);

    // One geocode + one overpass call across the two concurrent requests.
    const nominatimCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("nominatim")
    );
    const overpassCalls = fetchMock.mock.calls.filter(
      (c) => !String(c[0]).includes("nominatim")
    );
    expect(nominatimCalls).toHaveLength(1);
    expect(overpassCalls).toHaveLength(1);

    // A follow-up call hits the localStorage cache — no new network I/O.
    await getLiveRestaurants("Chennai");
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  it("falls back to synthetic city picks when the OSM feed is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const { mockRestaurants } = await import("../data/mockRestaurants");

    const restaurants = await getLiveRestaurants("Chennai");
    expect(restaurants.length).toBeGreaterThan(0);
    expect(restaurants.every((r) => r.city === "Chennai")).toBe(true);
    expect(restaurants.every((r) => mockRestaurants.some((c) => c.id === r.id))).toBe(true);

    // The fallback is served from the negative cache on the next visit (no refetch).
    const callsAfterFirst = fetchMock.mock.calls.length;
    await getLiveRestaurants("Chennai");
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("fills an empty OSM result with synthetic nearby picks", async () => {
    const emptyOverpass = { elements: [] };
    fetchMock.mockImplementation(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("nominatim")) {
        return {
          ok: true,
          status: 200,
          json: async () => GEOCODE_FIXTURE,
        } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => emptyOverpass } as unknown as Response;
    });

    const restaurants = await getLiveRestaurants("Chennai");
    expect(restaurants.length).toBeGreaterThan(0);
    expect(restaurants.every((r) => r.city === "Chennai")).toBe(true);
  });
});