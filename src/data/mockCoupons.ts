import type { Coupon } from "../types/order";

export const mockCoupons: Coupon[] = [
  {
    code: "FIRST50",
    description: "50% off up to ₹100 on your first order",
    discountType: "percentage",
    discountValue: 50,
    minOrderValue: 199,
    maxDiscount: 100,
    isValid: true,
  },
  {
    code: "FLAT100",
    description: "Flat ₹100 off on orders above ₹499",
    discountType: "flat",
    discountValue: 100,
    minOrderValue: 499,
    isValid: true,
  },
  {
    code: "SAVE20",
    description: "20% off up to ₹80",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 149,
    maxDiscount: 80,
    isValid: true,
  },
];

export function validateCoupon(
  code: string,
  subtotal: number
): { valid: boolean; message: string; coupon?: Coupon } {
  const coupon = mockCoupons.find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      message: `Add items worth ₹${coupon.minOrderValue - subtotal} more to use this coupon`,
    };
  }

  return { valid: true, message: "Coupon applied successfully!", coupon };
}

export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === "flat") {
    return coupon.discountValue;
  }

  const percentageDiscount = (subtotal * coupon.discountValue) / 100;
  return coupon.maxDiscount
    ? Math.min(percentageDiscount, coupon.maxDiscount)
    : percentageDiscount;
}