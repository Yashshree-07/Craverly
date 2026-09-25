import { calculateCartTotals, generateOrderId } from "../lib/utils";
import { calculateDiscount } from "../data/mockCoupons";

import { useState, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { ShoppingBag, UserRound, Zap, CalendarClock } from "lucide-react";

type PaymentMethod = "upi" | "card" | "cod";

interface GuestDetails {
  name: string;
  phone: string;
  fullAddress: string;
}

type DeliveryMode = "asap" | "scheduled";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useUserStore();
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    user?.addresses.find((a) => a.isDefault) ?? null
  );
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: "",
    phone: "",
    fullAddress: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("asap");
  const [scheduledTime, setScheduledTime] = useState("");

  const subtotal = getSubtotal();
  const discountAmount = appliedCoupon
    ? calculateDiscount(appliedCoupon, subtotal)
    : 0;
  const { taxAmount, deliveryFee, packagingFee, totalAmount } =
    calculateCartTotals(subtotal, discountAmount);

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : undefined;

  // Guest checkout requires a completed guest details form.
  const isGuestValid =
    guestDetails.name.trim().length > 1 &&
    guestDetails.phone.trim().length >= 10 &&
    guestDetails.fullAddress.trim().length >= 10;

  // Scheduling requires a time at least 30 minutes from now (and within 3 days).
  const canPlaceOrder =
    items.length > 0 &&
    (isAuthenticated && user ? selectedAddress !== null : isGuestValid);

  const handlePlaceOrder = () => {
    let deliveryAddress: Address;

    if (isAuthenticated && user && selectedAddress) {
      deliveryAddress = selectedAddress;
    } else if (isGuestValid) {
      deliveryAddress = {
        id: "guest",
        label: "Home",
        fullAddress: guestDetails.fullAddress.trim(),
        landmark: undefined,
        latitude: 13.0827 + (Math.random() - 0.5) * 0.05,
        longitude: 80.2707 + (Math.random() - 0.5) * 0.05,
        isDefault: false,
      };
    } else {
      toast.error("Please provide a delivery address");
      return;
    }

    if (!restaurant) {
      toast.error("Something went wrong with your cart. Please try again.");
      return;
    }

    if (deliveryMode === "scheduled") {
      const slot = scheduledTime ? new Date(scheduledTime) : null;
      const slotMin = new Date(Date.now() + 30 * 60000);
      const slotMax = new Date(Date.now() + 3 * 24 * 60 * 60000);
      if (
        !slot ||
        slot.getTime() <= slotMin.getTime() ||
        slot.getTime() > slotMax.getTime()
      ) {
        toast.error(
          "Please choose a delivery time at least 30 minutes away."
        );
        return;
      }
    }

    setIsPlacing(true);

    const orderId = generateOrderId();
    const now = new Date();
    const deliverAt =
      deliveryMode === "scheduled"
        ? new Date(scheduledTime)
        : new Date(now.getTime() + restaurant.deliveryTimeMinutes * 60000);

    const newOrder: Order = {
      id: orderId,
      userId: isAuthenticated && user ? user.id : "guest",
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
      deliveryAddress,
      paymentMethod,
      status: "placed",
      statusHistory: [{ status: "placed", timestamp: now.toISOString() }],
      placedAt: now.toISOString(),
      estimatedDeliveryTime: deliverAt.toISOString(),
      ...(deliveryMode === "scheduled"
        ? { scheduledDeliveryTime: deliverAt.toISOString() }
        : {}),
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
        <div className="md:col-span-2 space-y-4 min-w-0">
          {!isAuthenticated && (
            <div className="bg-peach-50 dark:bg-peach-900/10 border border-peach-200 dark:border-peach-900 rounded-lg p-3 text-sm text-peach-800 dark:text-peach-400">
              You're checking out as a guest.{" "}
              <Link
                to="/login"
                state={{ from: "/checkout" }}
                className="underline font-medium"
              >
                Login
              </Link>{" "}
              to save your address and track past orders.
            </div>
          )}

          {isAuthenticated ? (
            <AddressSelector
              selectedAddressId={selectedAddress?.id ?? null}
              onSelect={setSelectedAddress}
            />
          ) : (
            <GuestDetailsForm value={guestDetails} onChange={setGuestDetails} />
          )}

          <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

          <DeliveryTimeSelector
            mode={deliveryMode}
            onModeChange={setDeliveryMode}
            scheduledTime={scheduledTime}
            onScheduledTimeChange={setScheduledTime}
            deliveryTimeMinutes={restaurant?.deliveryTimeMinutes ?? 30}
          />
        </div>

        <div className="space-y-4 min-w-0">
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
            variant="peach"
            disabled={!canPlaceOrder}
            isLoading={isPlacing}
            onClick={handlePlaceOrder}
          >
            {isAuthenticated
              ? `Place order — ${formatPriceInline(totalAmount)}`
              : `Place order as guest — ${formatPriceInline(totalAmount)}`}
          </Button>
          {!isAuthenticated && !isGuestValid && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Add your name, phone and delivery address above to place the order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GuestDetailsForm({
  value,
  onChange,
}: {
  value: GuestDetails;
  onChange: (details: GuestDetails) => void;
}) {
  const fields: { key: keyof GuestDetails; label: string; placeholder: string; type: string }[] = [
    { key: "name", label: "Full name", placeholder: "Jane Doe", type: "text" },
    { key: "phone", label: "Phone number", placeholder: "+91 98765 43210", type: "tel" },
  ];

  return (
    <div className="bg-lavender-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <UserRound size={18} /> Guest delivery details
      </h3>

      <div className="space-y-3">
        {fields.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
              {label}
            </label>
            <input
              type={type}
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium mb-1.5 block text-gray-700 dark:text-gray-300">
            Delivery address
          </label>
          <textarea
            value={value.fullAddress}
            onChange={(e) => onChange({ ...value, fullAddress: e.target.value })}
            rows={3}
            placeholder="House/Flat no, Street, Area, City, Pincode"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
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

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function DeliveryTimeSelector({
  mode,
  onModeChange,
  scheduledTime,
  onScheduledTimeChange,
  deliveryTimeMinutes,
}: {
  mode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
  scheduledTime: string;
  onScheduledTimeChange: (value: string) => void;
  deliveryTimeMinutes: number;
}) {

  const options: {
    key: DeliveryMode;
    icon: ReactNode;
    title: string;
    subtitle: string;
  }[] = [
    {
      key: "asap",
      icon: <Zap size={16} />,
      title: "Deliver ASAP",
      subtitle: `In ~${deliveryTimeMinutes} minutes`,
    },
    {
      key: "scheduled",
      icon: <CalendarClock size={16} />,
      title: "Schedule for later",
      subtitle: "Order now, deliver at your slot",
    },
  ];

  return (
    <div className="bg-lavender-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <CalendarClock size={18} /> Delivery time
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onModeChange(option.key);
                if (option.key === "scheduled" && !scheduledTime) {
                  const suggestion = new Date(Date.now() + 90 * 60000);
                  suggestion.setMinutes(
                    suggestion.getMinutes() +
                      ((30 - (suggestion.getMinutes() % 30)) % 30),
                    0,
                    0
                  );
                  onScheduledTimeChange(toDatetimeLocal(suggestion));
                }
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span
                className={`flex items-center gap-1.5 font-medium text-sm ${
                  selected
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {option.icon} {option.title}
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                {option.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "scheduled" && (
        <div className="mt-3">
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => onScheduledTimeChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          />
          {!scheduledTime && (
            <p className="text-xs text-red-500 mt-1.5">
              Pick a time at least 30 minutes away (up to 3 days ahead).
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1.5">
            Your order stays confirmed until your slot — the kitchen starts
            preparing closer to the delivery time.
          </p>
        </div>
      )}
    </div>
  );
}