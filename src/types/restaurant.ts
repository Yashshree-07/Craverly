export type VegType = "veg" | "non-veg" | "vegan";

export interface MenuItemCustomization {
  id: string;
  name: string;
  options: {
    id: string;
    label: string;
    priceModifier: number; // added to base price
  }[];
  required: boolean;
  maxSelect: number;
}

export interface MenuItemNutrition {
  calories?: number;
  allergens: string[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  vegType: VegType;
  category: string; // e.g. "Starters", "Main Course", "Desserts"
  isBestseller?: boolean;
  isAvailable: boolean;
  customizations?: MenuItemCustomization[];
  rating?: number;
  ratingCount?: number;
  nutrition?: MenuItemNutrition;
}

export interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  createdAt: string; // ISO date
  helpfulCount: number;
  ownerReply?: {
    text: string;
    repliedAt: string;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  coverImage?: string;
  source?: "osm" | "catalog";
  cuisines: string[];
  rating: number;
  ratingCount: number;
  costForTwo: number;
  deliveryTimeMinutes: number;
  distanceKm: number;
  address: string;
  area: string;
  city: string;
  isOpen: boolean;
  openingHours: string;
  contact?: string;
  fssaiLicense?: string;
  offers?: Offer[];
  isPromoted?: boolean;
  vegOnly?: boolean;
  latitude: number;
  longitude: number;
}

export interface Offer {
  id: string;
  code: string;
  description: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}

export interface RestaurantFilters {
  cuisines: string[];
  minRating: number;
  priceRange: [number, number];
  vegType: VegType | "all";
  hasOffers: boolean;
  maxDeliveryTime: number | null;
  sortBy:
    | "rating"
    | "deliveryTime"
    | "costLowHigh"
    | "costHighLow"
    | "popularity"
    | "nearMe";
}