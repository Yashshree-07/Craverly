// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { getChatReply } from "./chatEngine";
import { useOrderStore } from "../store/orderStore";
import type { Order, Address } from "../types/order";

const testAddress: Address = {
  id: "test",
  label: "Home",
  fullAddress: "1 Test Street, Chennai",
  latitude: 13.08,
  longitude: 80.27,
  isDefault: true,
};

function buildOrder(id: string, status: Order["status"]): Order {
  return {
    id,
    userId: "u_test",
    restaurantId: "r1",
    restaurantName: "Spice Symphony",
    restaurantImage: "img",
    items: [],
    subtotal: 100,
    taxAmount: 5,
    deliveryFee: 40,
    packagingFee: 15,
    discountAmount: 0,
    totalAmount: 160,
    deliveryAddress: testAddress,
    paymentMethod: "upi",
    status,
    statusHistory: [{ status, timestamp: new Date().toISOString() }],
    placedAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date().toISOString(),
  };
}

describe("chatEngine", () => {
  it("greets on hello", async () => {
    const reply = await getChatReply("hi");
    expect(reply.quickReplies?.length).toBeGreaterThan(0);
    expect(reply.text.toLowerCase()).toContain("craverly");
  });

  it("navigates for vegan under budget", async () => {
    const reply = await getChatReply("show me vegan restaurants under ₹300");
    expect(reply.action?.type).toBe("navigate");
    expect(reply.action?.path).toContain("veg=vegan");
    expect(reply.action?.path).toContain("price=0%2C300");
  });

  it("answers dish ingredient questions", async () => {
    const reply = await getChatReply("what's in the butter chicken?");
    expect(reply.text).toContain("Butter Chicken");
    expect(reply.text).toContain("₹320");
    expect(reply.quickReplies?.some((q) => q.includes("Add Butter Chicken"))).toBe(true);
  });

  it("adds a dish to cart via action", async () => {
    const reply = await getChatReply("add margherita pizza to cart");
    expect(reply.action?.type).toBe("addToCart");
    expect(reply.action?.item?.name).toBe("Margherita Pizza");
  });

  it("reports order status from the store", async () => {
    useOrderStore.getState().placeOrder(buildOrder("CRV123", "preparing"));
    const reply = await getChatReply("where's my order?");
    expect(reply.text).toContain("CRV123");
    expect(reply.text).toContain("Preparing");
    expect(reply.action?.type).toBe("navigate");
    expect(reply.action?.path).toContain("/orders/CRV123/track");
  });

  it("handles no orders gracefully", async () => {
    useOrderStore.setState({ orders: [] });
    const reply = await getChatReply("track my order");
    expect(reply.text.toLowerCase()).toMatch(/don'?t have any orders/);
  });

  it("lists offers on coupons query", async () => {
    const reply = await getChatReply("any offers today?");
    expect(reply.text).toContain("FLAT100");
  });

  it("recommends restaurants for a craving", async () => {
    const reply = await getChatReply("I want something spicy");
    expect(reply.text).toContain("spicy picks");
    expect(reply.text).toMatch(
      /Spice Symphony|Dragon Wok|Kung Pao|Wok This Way|Dilli Thali|Nawab|Royal Dum|Ambur|Rajwada/
    );
  });

  it("filters to trending bestsellers", async () => {
    const reply = await getChatReply("what's trending?");
    expect(reply.text).toMatch(/Butter Chicken|Buddha Bowl|Margherita/);
  });

  it("falls back politely on garbage input", async () => {
    const reply = await getChatReply("zzzz wwwww qqqqq");
    expect(reply.quickReplies?.length).toBeGreaterThan(0);
  });
});