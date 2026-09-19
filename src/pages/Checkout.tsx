import { calculateCartTotals, generateOrderId } from "../lib/utils";
import { calculateDiscount } from "../data/mockCoupons";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { useOrderStore } from "../store/orderStore";
import { AddressSelector } from "../components/checkout/AddressSelector";
import { PaymentMethodSelector } from "../components/checkout/PaymentMethodSelector";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { Button } from "../components/common/Button";
import type { Address, Coupon, Order } from "../types/order";
import { getRestaurantById } from "../data/mockRestaurants";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

type PaymentMethod = "upi" | "card" | "cod";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useUserStore();
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    user?.addresses.find((a) => a.isDefault) ?? null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = appliedCoupon
    ? calculateDiscount(appliedCoupon, subtotal)
    : 0;
  const { taxAmount, deliveryFee, packagingFee, totalAmount } =
    calculateCartTotals(subtotal, discountAmount);

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;

  const canPlaceOrder = items.length > 0 && selectedAddress && isAuthenticated;

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!restaurant) {
      toast.error("Something went wrong with your cart. Please try again.");
      return;
    }

    setIsPlacing(true);

    const orderId = generateOrderId();
    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + restaurant.deliveryTimeMinutes * 60000);

    const newOrder: Order = {
      id: orderId,
      userId: user!.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantImage: restaurant.image,
      items,
      subtotal,
      taxAmount,
      deliveryFee,
      packagingFee,
      discountAmount,
      couponCode: appliedCoupon?.code,
      totalAmount,
      deliveryAddress: selectedAddress,
      paymentMethod,
      status: "placed",
      statusHistory: [{ status: "placed", timestamp: now.toISOString() }],
      placedAt: now.toISOString(),
      estimatedDeliveryTime: estimatedDelivery.toISOString(),
      deliveryPartner: {
        name: "Ravi Kumar",
        phone: "+91 98765 43210",
        currentLat: restaurant.latitude,
        currentLng: restaurant.longitude,
      },
    };

    // Simulate network delay for realism
    setTimeout(() => {
      placeOrder(newOrder);
      clearCart();
      setIsPlacing(false);
      toast.success("Order placed successfully!");
      navigate(`/orders/${orderId}/track`);
    }, 1200);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Add items from a restaurant before checking out.
        </p>
        <Button onClick={() => navigate("/restaurants")}>Browse restaurants</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {!isAuthenticated && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-400">
              You need to{" "}
              <button
                onClick={() => navigate("/login")}
                className="underline font-medium"
              >
                login
              </button>{" "}
              before placing an order.
            </div>
          )}

          <AddressSelector
            selectedAddressId={selectedAddress?.id ?? null}
            onSelect={setSelectedAddress}
          />

          <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        </div>

        <div className="space-y-4">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            taxAmount={taxAmount}
            deliveryFee={deliveryFee}
            packagingFee={packagingFee}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            onApplyCoupon={setAppliedCoupon}
            totalAmount={totalAmount}
          />

          <Button
            className="w-full"
            size="lg"
            disabled={!canPlaceOrder}
            isLoading={isPlacing}
            onClick={handlePlaceOrder}
          >
            Place order — {formatPriceInline(totalAmount)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatPriceInline(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}