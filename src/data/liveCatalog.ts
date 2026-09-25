import type { Restaurant, MenuItem } from "../types/restaurant";
import { buildMenuForCuisines } from "./menuBanks";

// Runtime registry for live (OpenStreetMap) restaurants. These are registered
// at runtime from src/lib/liveRestaurants and made resolvable by id so that
// detail pages, menus, and add-to-cart work exactly like catalog restaurants.

const liveRestaurants = new Map<string, Restaurant>();
const liveMenus = new Map<string, MenuItem[]>();

export function registerLiveRestaurants(restaurants: Restaurant[]): void {
  for (const restaurant of restaurants) {
    if (liveRestaurants.has(restaurant.id)) continue;
    liveRestaurants.set(restaurant.id, restaurant);
    liveMenus.set(
      restaurant.id,
      buildMenuForCuisines(restaurant.id, restaurant.cuisines)
    );
  }
}

export function getLiveRestaurant(id: string): Restaurant | undefined {
  return liveRestaurants.get(id);
}

export function getLiveMenu(restaurantId: string): MenuItem[] {
  return liveMenus.get(restaurantId) ?? [];
}

export function isLiveRestaurant(id: string): boolean {
  return liveRestaurants.has(id);
}