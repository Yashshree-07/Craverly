export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface CartItemCustomizationSelection {
  customizationId: string;
  optionIds: string[];
}

export interface CartItem {
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vegType: "veg" | "non-veg" | "vegan";
  selectedCustomizations?: CartItemCustomizationSelection[];
  specialInstructions?: string;
}

export interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  fullAddress: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string; // ISO date
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  packagingFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  deliveryAddress: Address;
  paymentMethod: "upi" | "card" | "cod";
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  placedAt: string;
  estimatedDeliveryTime: string;
  deliveryPartner?: {
    name: string;
    phone: string;
    currentLat: number;
    currentLng: number;
  };
}

export interface Coupon {
  code: string;
  description: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  isValid: boolean;
}