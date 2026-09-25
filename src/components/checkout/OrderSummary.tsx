import { useState } from "react";
import { Tag, X } from "lucide-react";
import type { CartItem, Coupon } from "../../types/order";
import { formatPrice } from "../../lib/utils";
import { validateCoupon } from "../../data/mockCoupons";
import { toast } from "sonner";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  packagingFee: number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  onApplyCoupon: (coupon: Coupon | null) => void;
  totalAmount: number;
}

export function OrderSummary({
  items,
  subtotal,
  taxAmount,
  deliveryFee,
  packagingFee,
  appliedCoupon,
  discountAmount,
  onApplyCoupon,
  totalAmount,
}: OrderSummaryProps) {
  const [couponInput, setCouponInput] = useState("");

  const handleApply = () => {
    if (!couponInput.trim()) return;

    const result = validateCoupon(couponInput, subtotal);
    if (result.valid && result.coupon) {
      onApplyCoupon(result.coupon);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    setCouponInput("");
  };

  return (
    <div className="bg-lavender-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 min-w-0">
      <h3 className="font-semibold mb-3">Order summary</h3>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.menuItemId}
            className="flex justify-between gap-3 text-sm"
          >
            <span className="text-gray-600 dark:text-gray-400 min-w-0 truncate">
              {item.quantity} × {item.name}
            </span>
            <span className="font-medium shrink-0">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Coupon */}
      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 rounded-lg px-3 py-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <Tag size={14} />
            <span className="font-medium">{appliedCoupon.code}</span> applied
          </div>
          <button onClick={handleRemove}>
            <X size={14} className="text-green-700 dark:text-green-400" />
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <label
            htmlFor="coupon-input"
            className="block text-xs font-medium text-gray-500 mb-1.5"
          >
            Coupon code <span className="text-gray-400">(optional)</span>
          </label>
          <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus-within:ring-2 focus-within:ring-primary-500 overflow-hidden">
            <Tag size={16} className="ml-3 text-gray-400 shrink-0" />
            <input
              id="coupon-input"
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
              }}
              placeholder="Enter coupon code"
              className="flex-1 min-w-0 px-2 py-2 bg-transparent text-sm focus:outline-none"
            />
            <button
              onClick={handleApply}
              disabled={!couponInput.trim()}
              className="shrink-0 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Taxes</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Delivery fee</span>
          <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Packaging fee</span>
          <span>{formatPrice(packagingFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800">
          <span>To pay</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}