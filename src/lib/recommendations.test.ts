import { describe, it, expect } from "vitest";
import { getDishRecommendations, getTrendingDishes } from "./recommendations";
import type { Order } from "../types/order";
import type { User } from "../types/user";
import type { Address } from "../types/order";

const address: Address = {
  id: "a1",
  label: "Home",
  fullAddress: "1 Test Street, Chennai",
  latitude: 13.08,
  longitude: 80.27,
  isDefault: true,
};

function orderWithItems(userId: string, items: Order["items"]): Order {
  return {
    id: `o_${userId}_${Math.random()}`,
    userId,
    restaurantId: "r1",
    restaurantName: "Spice Symphony",
    restaurantImage: "img",
    items,
    subtotal: 100,
    taxAmount: 5,
    deliveryFee: 40,
    packagingFee: 15,
    discountAmount: 0,
    totalAmount: 160,
    deliveryAddress: address,
    paymentMethod: "upi",
    status: "delivered",
    statusHistory: [
      { status: "delivered", timestamp: new Date().toISOString() },
    ],
    placedAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date().toISOString(),
  };
}

describe("recommendations", () => {
  it("boosts dishes the user ordered before", () => {
    const user: User = {
      id: "u1",
      name: "Test",
      email: "test@test.com",
      addresses: [],
      favoriteRestaurantIds: [],
      favoriteMenuItemIds: [],
      createdAt: new Date().toISOString(),
    };
    const orders = [
      orderWithItems("u1", [
        {
          menuItemId: "m1",
          restaurantId: "r1",
          name: "Butter Chicken",
          price: 320,
          quantity: 1,
          vegType: "non-veg",
        },
      ]),
    ];

    const picks = getDishRecommendations({ user, orders });
    const butterChicken = picks.find((p) => p.item.id === "m1");
    expect(butterChicken).toBeDefined();
    expect(butterChicken?.reasons).toContain("Ordered before");
    expect(butterChicken?.score).toBeGreaterThan(0);
  });

  it("prefers veg dishes for users with no non-veg history", () => {
    const user: User = {
      id: "u2",
      name: "Veg",
      email: "veg@test.com",
      addresses: [],
      favoriteRestaurantIds: [],
      favoriteMenuItemIds: [],
      createdAt: new Date().toISOString(),
    };
    const orders = [
      orderWithItems("u2", [
        {
          menuItemId: "m5",
          restaurantId: "r2",
          name: "Buddha Bowl",
          price: 280,
          quantity: 1,
          vegType: "vegan",
        },
      ]),
    ];

    const picks = getDishRecommendations({ user, orders }, 500);
    const peppernoni = picks.find((p) => p.item.id === "m10");
    expect(peppernoni).toBeDefined();
    expect(peppernoni?.score).toBeLessThan(0);
  });

  it("supports favorites signal", () => {
    const user: User = {
      id: "u3",
      name: "Fan",
      email: "fan@test.com",
      addresses: [],
      favoriteRestaurantIds: [],
      favoriteMenuItemIds: ["m11"],
      createdAt: new Date().toISOString(),
    };
    const picks = getDishRecommendations({ user, orders: [] });
    const cake = picks.find((p) => p.item.id === "m11");
    expect(cake?.reasons).toContain("In your favorites");
  });

  it("returns trending dishes as a fallback", () => {
    const trending = getTrendingDishes();
    expect(trending.length).toBeGreaterThan(0);
    expect(trending[0]?.item).toBeDefined();
  });
});