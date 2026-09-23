import {
  mockRestaurants,
  mockMenuItems,
  getRestaurantById,
} from "../data/mockRestaurants";
import { mockCoupons } from "../data/mockCoupons";
import { useOrderStore } from "../store/orderStore";
import { useCartStore } from "../store/cartStore";
import type { CartItem } from "../types/order";

export interface ChatAction {
  type: "navigate" | "addToCart";
  path?: string;
  item?: CartItem;
}

export interface ChatReply {
  text: string;
  quickReplies?: string[];
  action?: ChatAction;
}

const DEFAULT_QUICK_REPLIES = [
  "Track my order",
  "Recommend food",
  "Offers today",
  "Vegan under ₹300",
  "Trending dishes",
  "What's in my cart?",
];

const VEG_KEYWORDS: Record<string, "veg" | "vegan" | "non-veg"> = {
  vegan: "vegan",
  vegetarian: "veg",
  veg: "veg",
  "pure veg": "veg",
  jain: "veg",
  "non veg": "non-veg",
  nonveg: "non-veg",
  "non-vegetarian": "non-veg",
  chicken: "non-veg",
  meat: "non-veg",
};

const CRAVING_MAP: { key: string; label: string; cuisines: string[] }[] = [
  { key: "spicy", label: "spicy", cuisines: ["North Indian", "Chinese", "Mughlai"] },
  { key: "sweet", label: "sweet", cuisines: ["Desserts", "Bakery"] },
  { key: "healthy", label: "healthy", cuisines: ["Healthy", "Salads", "Vegan"] },
  { key: "dessert", label: "dessert", cuisines: ["Desserts", "Bakery"] },
  { key: "belly", label: "heavy", cuisines: ["Mughlai", "North Indian"] },
  { key: "comfort", label: "comfort", cuisines: ["Italian", "Pizza", "Fast Food"] },
  { key: "junk", label: "comfort food", cuisines: ["Fast Food", "Pizza"] },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchCuisines(input: string): string[] {
  const normalized = input.toLowerCase();
  return allCuisinesFilter().filter((c) => {
    const needle = c.toLowerCase();
    if (needle === "chinese") return normalized.includes("chinese") || normalized.includes("chinese food");
    if (needle === "pizza") return normalized.includes("pizza");
    if (needle === "biryani") return normalized.includes("biryani");
    return normalized.includes(needle) || normalized.includes(needle.replace(/\s+/g, " "));
  });
}

function allCuisinesFilter(): string[] {
  return Array.from(new Set(mockRestaurants.flatMap((r) => r.cuisines))).sort();
}

function matchVegType(input: string): "veg" | "vegan" | "non-veg" | null {
  const normalized = input.toLowerCase();
  for (const [keyword, type] of Object.entries(VEG_KEYWORDS)) {
    if (normalized.includes(keyword)) return type;
  }
  return null;
}

function matchPrice(input: string): [number, number] | null {
  const normalized = input.toLowerCase();
  const underMatch = normalized.match(/under\s*(?:₹|rs\.?\s*)?(\d{2,4})/);
  if (underMatch) return [0, Number(underMatch[1])];

  const cheapKeywords = ["cheap", "budget", "affordable", "economical", "low cost"];
  if (cheapKeywords.some((k) => normalized.includes(k))) return [0, 400];

  return null;
}

function buildListingPath(opts: {
  cuisines?: string[];
  veg?: string;
  price?: [number, number];
  sort?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.cuisines && opts.cuisines.length > 0) params.set("cuisines", opts.cuisines.join(","));
  if (opts.veg && opts.veg !== "all") params.set("veg", opts.veg);
  if (opts.price) params.set("price", `${opts.price[0]},${opts.price[1]}`);
  if (opts.sort) params.set("sort", opts.sort);
  const query = params.toString();
  return query ? `/restaurants?${query}` : "/restaurants";
}

function findDish(query: string) {
  const normalized = normalize(query);
  return (
    mockMenuItems.find((m) => normalized.includes(normalize(m.name))) ??
    mockMenuItems.find((m) => normalize(m.name).includes(normalized)) ??
    mockMenuItems.find((m) => normalize(m.description ?? "").includes(normalized))
  );
}

function findRestaurant(query: string) {
  const normalized = normalize(query);
  return mockRestaurants.find((r) => normalized.includes(normalize(r.name)));
}

function formatRestaurant(r: (typeof mockRestaurants)[number]): string {
  return `${r.name} (${r.cuisines.join(", ")}) • ₹${r.costForTwo} for two • ${
    r.deliveryTimeMinutes
  } min • ${r.rating}★`;
}

export async function getChatReply(input: string): Promise<ChatReply> {
  const normalized = normalize(input);
  const lower = input.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|yo|namaste)\b/.test(normalized)) {
    return {
      text: "Hey there! 👋 I'm Craverly's assistant. Ask me to find restaurants, check dish details, track orders, or grab today's offers.",
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // Help
  if (/(help|what can you do|how (do|can) i|features)/.test(normalized)) {
    return {
      text: "Here's what I can do:\n• 🍽️ Find restaurants — \"vegan under ₹300\"\n• 🔎 Dish details — \"what's in the butter chicken?\"\n• 🛵 Track orders — \"where's my order?\"\n• 🏷️ Coupons — \"offers today\"\n• 😋 Recommendations — \"I want something spicy\"",
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // Add to cart
  const addMatch = lower.match(/add (.+?) to (my )?cart/);
  if (addMatch) {
    const dish = findDish(addMatch[1]);
    if (dish) {
      const restaurant = getRestaurantById(dish.restaurantId);
      const item: CartItem = {
        menuItemId: dish.id,
        restaurantId: dish.restaurantId,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        image: dish.image,
        vegType: dish.vegType,
      };
      return {
        text: `Added ${dish.name} from ${restaurant?.name ?? "the restaurant"} to your cart. Want anything else?`,
        quickReplies: ["What's in my cart?", "Checkout now"],
        action: { type: "addToCart", item },
      };
    }
    return {
      text: "I couldn't find that dish on the menu. Try one like Butter Chicken, Buddha Bowl, or Margherita Pizza.",
      quickReplies: ["Trending dishes"],
    };
  }

  // Checkout navigation
  if (/checkout|go to cart|place order/.test(normalized)) {
    const count = useCartStore.getState().getTotalItems();
    return {
      text:
        count > 0
          ? `You have ${count} item(s) ready to checkout. Taking you there now.`
          : "Your cart is empty. Add something tasty first!",
      quickReplies: count > 0 ? ["Track my order"] : ["Recommend food"],
      action: count > 0 ? { type: "navigate", path: "/checkout" } : undefined,
    };
  }

  // Cart contents
  if (/(what'?s in my cart|my cart|cart total|cart items)/.test(normalized)) {
    const { items, getSubtotal } = useCartStore.getState();
    if (items.length === 0) {
      return {
        text: "Your cart is empty. Want me to recommend something?",
        quickReplies: ["Recommend food", "Trending dishes"],
      };
    }
    const lines = items
      .map((i) => `${i.quantity} × ${i.name} — ₹${i.price * i.quantity}`)
      .join("\n");
    return {
      text: `Here's your cart:\n${lines}\nTotal: ₹${getSubtotal()}`,
      quickReplies: ["Checkout now", "Clear my cart"],
    };
  }

  // Clear cart
  if (/clear my cart|empty my cart|remove everything/.test(normalized)) {
    useCartStore.getState().clearCart();
    return {
      text: "Your cart has been cleared.",
      quickReplies: ["Recommend food", "Offers today"],
    };
  }

  // Order status
  if (
    /(where'?s my order|track my order|order status|my order|delivery status)/.test(
      normalized
    )
  ) {
    const { orders } = useOrderStore.getState();
    if (orders.length === 0) {
      return {
        text: "You don't have any orders yet. Craving something? I can help you find it!",
        quickReplies: ["Recommend food", "Offers today"],
      };
    }
    const latest = orders[0];
    const statusLabels: Record<string, string> = {
      placed: "Order placed ✅",
      confirmed: "Confirmed ✅",
      preparing: "Preparing your food 🔪",
      out_for_delivery: "Out for delivery 🛵",
      delivered: "Delivered 🎉",
      cancelled: "Cancelled ❌",
    };
    const eta = latest.estimatedDeliveryTime
      ? new Date(latest.estimatedDeliveryTime).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "soon";
    return {
      text: `Your latest order (${latest.id}) from ${latest.restaurantName} is: ${statusLabels[latest.status]}.${
        latest.status === "delivered"
          ? ""
          : ` Estimated delivery by ${eta}.`
      }`,
      quickReplies: ["View order", "Track my order"],
      action:
        latest.status === "delivered"
          ? undefined
          : { type: "navigate", path: `/orders/${latest.id}/track` },
    };
  }

  // View order
  if (/view order/.test(normalized)) {
    const { orders } = useOrderStore.getState();
    if (orders.length === 0) {
      return {
        text: "You don't have any orders yet.",
        quickReplies: ["Recommend food"],
      };
    }
    return { text: "Opening the latest order.", action: { type: "navigate", path: `/orders/${orders[0].id}/track` } };
  }

  // Coupons / offers
  if (/(offer|offers|coupon|discount|promo|deal)/.test(normalized)) {
    const coupons = mockCoupons
      .map((c) => `${c.code} — ${c.description}`)
      .join("\n");
    const restaurantOffers = mockRestaurants
      .flatMap((r) => (r.offers ?? []).map((o) => `${r.name}: ${o.description}`))
      .slice(0, 3)
      .join("\n");
    return {
      text: `Current offers:\n${coupons}${restaurantOffers ? `\n\nRestaurant deals:\n${restaurantOffers}` : ""}`,
      quickReplies: ["Vegan under ₹300", "Recommend food"],
    };
  }

  // Dish details
  const dishMatch =
    /(what'?s? (in|included in)|ingredients of|tell me about|info on|about) (.+)/.exec(
      normalized
    );
  if (dishMatch) {
    const dish = findDish(dishMatch[3]);
    if (dish) {
      const restaurant = getRestaurantById(dish.restaurantId);
      return {
        text: `**${dish.name}** — ₹${dish.price} (${dish.vegType})\n${dish.description}\nServed at ${restaurant?.name ?? "Craverly"}${dish.isBestseller ? " • Bestseller 🔥" : ""}`,
        quickReplies: [
          `Add ${dish.name} to cart`,
          "View restaurant",
          "Recommend food",
        ],
      };
    }
    return {
      text: "I couldn't find that dish. Ask about Butter Chicken, Buddha Bowl, Margherita Pizza, or Belgian Chocolate Cake.",
      quickReplies: ["Trending dishes"],
    };
  }

  // Any bare dish name mention
  const dish = findDish(normalized);
  if (dish && normalized.length <= 60) {
    const restaurant = getRestaurantById(dish.restaurantId);
    return {
      text: `**${dish.name}** — ₹${dish.price} (${dish.vegType})\n${dish.description}\nServed at ${restaurant?.name ?? "Craverly"}${dish.isBestseller ? " • Bestseller 🔥" : ""}`,
      quickReplies: [
        `Add ${dish.name} to cart`,
        "View restaurant",
        "Recommend food",
      ],
    };
  }

  // Menu of a restaurant
  const menuMatch = /(?:menu|serve|dishes) of (.+)/.exec(normalized);
  if (menuMatch) {
    const restaurant = findRestaurant(menuMatch[1]);
    if (restaurant) {
      return {
        text: `Opening the menu for ${restaurant.name}.`,
        quickReplies: ["Recommend food", "Offers today"],
        action: { type: "navigate", path: `/restaurant/${restaurant.id}` },
      };
    }
  }

  // View restaurant
  if (/view restaurant|open restaurant|go to restaurant/.test(normalized)) {
    const query = normalized
      .replace(/view restaurant|open restaurant|go to restaurant/g, "")
      .trim();
    const restaurant = query ? findRestaurant(query) : undefined;
    if (restaurant) {
      return {
        text: `Opening ${restaurant.name}.`,
        action: { type: "navigate", path: `/restaurant/${restaurant.id}` },
      };
    }
  }

  // Recommendations by craving/mood
  const craving = CRAVING_MAP.find((c) => lower.includes(c.key));
  if (/recommend|what should i eat|suggest|craving|hungry|something (spicy|sweet|healthy)/.test(normalized) || craving) {
    const wantVeg = matchVegType(normalized);
    const matches = mockRestaurants
      .filter((r) => !craving || craving.cuisines.some((c) => r.cuisines.includes(c)))
      .filter((r) => !wantVeg || (wantVeg === "vegan" ? r.vegOnly : wantVeg === "non-veg" ? !r.vegOnly : r.vegOnly))
      .sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes)
      .slice(0, 3);

    if (matches.length > 0) {
      const prefix = craving ? `Here are some ${craving.label} picks for you:\n` : "Here's what I'd recommend:\n";
      const list = matches
        .map((r) => `${r.name} (${r.rating}★, ${r.deliveryTimeMinutes} min, ${r.cuisines.join(", ")})`)
        .join("\n");
      return {
        text: `${prefix}${list}`,
        quickReplies: [...matches.map((r) => `Menu of ${r.name}`), "Offers today"],
      };
    }
    return {
      text: `I couldn't find matches for "${craving ? craving.label : "that"}" right now. Try places like Spice Symphony or Green Bowl Cafe.`,
      quickReplies: ["Recommend food", "Track my order"],
    };
  }

  // Fast delivery
  if (/(fast|quickest|fastest delivery)/.test(normalized)) {
    const list = [...mockRestaurants]
      .sort((a, b) => a.deliveryTimeMinutes - b.deliveryTimeMinutes)
      .slice(0, 3)
      .map((r) => `${r.name} — ${r.deliveryTimeMinutes} min (₹${r.costForTwo} for two)`)
      .join("\n");
    return {
      text: `Fastest on the block:\n${list}`,
      quickReplies: ["Recommend food", "Offers today"],
    };
  }

  // Library of restaurant finders: veg + price + cuisine combos
  const price = matchPrice(normalized);
  const vegType = matchVegType(normalized);
  const cuisines = matchCuisines(normalized);

  if (price || vegType || cuisines.length > 0 || /restaurants?/.test(normalized)) {
    const path = buildListingPath({
      cuisines: cuisines.length > 0 ? cuisines : undefined,
      veg: vegType ?? undefined,
      price: price ?? undefined,
    });
    const parts: string[] = [];
    if (cuisines.length > 0) parts.push(cuisines.join(" & "));
    if (vegType) parts.push(vegType);
    if (price) parts.push(`under ₹${price[1]}`);
    if (parts.length === 0) parts.push("all");
    return {
      text: `Showing you ${parts.join(", ")} restaurants. Tap a card to explore the menu!`,
      quickReplies: cuisines.length > 0
        ? [`Menu of ${cuisines[0]} restaurant`, "Recommend food"]
        : ["Recommend food", "Offers today"],
      action: { type: "navigate", path },
    };
  }

  // Top rated
  if (/(top rated|best restaurants|highest rated|top restaurants)/.test(normalized)) {
    const list = [...mockRestaurants]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map((r) => formatRestaurant(r))
      .join("\n");
    return {
      text: `Top rated near you:\n${list}`,
      quickReplies: ["Recommend food", "Track my order"],
    };
  }

  // Trending / popular dishes
  if (/(trending|popular|bestseller|best sellers)/.test(normalized)) {
    const list = mockMenuItems
      .filter((m) => m.isBestseller)
      .slice(0, 5)
      .map((m) => `${m.name} — ₹${m.price} at ${getRestaurantById(m.restaurantId)?.name ?? "Craverly"}`)
      .join("\n");
    return {
      text: `🔥 Trending right now:\n${list}`,
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // Thanks / bye
  if (/(thank|thanks|ty|bye|goodbye)/.test(normalized)) {
    return {
      text: "You're welcome! Enjoy your meal 🍜 Happy to help anytime.",
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // Fallback
  return {
    text: "I didn't quite catch that. Try asking me to find restaurants, check a dish, track an order, or grab offers!",
    quickReplies: DEFAULT_QUICK_REPLIES,
  };
}