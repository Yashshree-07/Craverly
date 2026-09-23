import type { MenuItem, Restaurant } from "../types/restaurant";
import type { Order } from "../types/order";
import type { User } from "../types/user";
import { mockRestaurants, getMenuByRestaurantId } from "../data/mockRestaurants";

export interface DishRecommendation {
  item: MenuItem;
  restaurant: Restaurant;
  score: number;
  reasons: string[];
}

interface RecInput {
  user: User | null;
  orders: Order[];
}

// Scores dishes based on real user signals: order history, favorites, and
// popularity. Prefers veg/vegan items when the user has never ordered meat.
export function getDishRecommendations(
  { user, orders }: RecInput,
  limit = 8
): DishRecommendation[] {
  const orderedMenuItemIds = new Set<string>();
  const orderedRestaurantIds = new Set<string>();
  const orderedCuisines = new Set<string>();
  let hasOrderedNonVeg = false;

  for (const order of orders) {
    orderedRestaurantIds.add(order.restaurantId);
    for (const item of order.items) {
      orderedMenuItemIds.add(item.menuItemId);
      if (item.vegType === "non-veg") hasOrderedNonVeg = true;
    }
  }

  const favoriteRestaurantIds = new Set(user?.favoriteRestaurantIds ?? []);
  const favoriteMenuItemIds = new Set(user?.favoriteMenuItemIds ?? []);

  // Infer cuisine affinity from restaurants the user has ordered from.
  for (const restaurant of mockRestaurants) {
    if (orderedRestaurantIds.has(restaurant.id)) {
      for (const cuisine of restaurant.cuisines) orderedCuisines.add(cuisine);
    }
  }

  const prefersVeg =
    !hasOrderedNonVeg &&
    (orders.length > 0 || (user?.favoriteMenuItemIds.length ?? 0) > 0);

  const results: DishRecommendation[] = [];

  for (const restaurant of mockRestaurants) {
    for (const item of getMenuByRestaurantId(restaurant.id)) {
      if (!item.isAvailable) continue;

      let score = 0;
      const reasons: string[] = [];

      if (item.isBestseller) {
        score += 3;
        reasons.push("Bestseller");
      }

      if (orderedMenuItemIds.has(item.id)) {
        score += 5;
        reasons.push("Ordered before");
      }

      if (favoriteMenuItemIds.has(item.id)) {
        score += 6;
        reasons.push("In your favorites");
      }

      if (favoriteRestaurantIds.has(restaurant.id)) {
        score += 1.5;
      }

      const sharesCuisine = restaurant.cuisines.some((c) => orderedCuisines.has(c));
      if (sharesCuisine && orderedRestaurantIds.size > 0) {
        score += 2;
        if (reasons.length < 2) reasons.push("Fits your taste");
      }

      if (prefersVeg && item.vegType === "non-veg") {
        score -= 4;
      } else if (item.vegType === "vegan") {
        score += 0.5;
      }

      results.push({
        item,
        restaurant,
        score,
        reasons: reasons.slice(0, 2),
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Fallback "trending" recommendations for users with no history.
export function getTrendingDishes(limit = 8): DishRecommendation[] {
  const results: DishRecommendation[] = [];
  for (const restaurant of mockRestaurants) {
    for (const item of getMenuByRestaurantId(restaurant.id)) {
      if (!item.isAvailable) continue;
      const score = (item.isBestseller ? 3 : 0) + (item.rating ?? 0) + Math.min(item.ratingCount ?? 0, 1000) / 200;
      results.push({ item, restaurant, score, reasons: item.isBestseller ? ["Bestseller"] : [] });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}