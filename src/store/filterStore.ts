import { create } from "zustand";
import type { RestaurantFilters } from "../types/restaurant";
interface FilterState extends RestaurantFilters {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCuisines: (cuisines: string[]) => void;
  toggleCuisine: (cuisine: string) => void;
  setMinRating: (rating: number) => void;
  setPriceRange: (range: [number, number]) => void;
  setVegType: (vegType: RestaurantFilters["vegType"]) => void;
  setHasOffers: (hasOffers: boolean) => void;
  setMaxDeliveryTime: (minutes: number | null) => void;
  setSortBy: (sortBy: RestaurantFilters["sortBy"]) => void;
  resetFilters: () => void;
}

const defaultFilters: RestaurantFilters = {
  cuisines: [],
  minRating: 0,
  priceRange: [0, 2000],
  vegType: "all",
  hasOffers: false,
  maxDeliveryTime: null,
  sortBy: "popularity",
};

export const useFilterStore = create<FilterState>((set, get) => ({
  ...defaultFilters,
  searchQuery: "",

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCuisines: (cuisines) => set({ cuisines }),

  toggleCuisine: (cuisine) => {
    const current = get().cuisines;
    const updated = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    set({ cuisines: updated });
  },

  setMinRating: (minRating) => set({ minRating }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setVegType: (vegType) => set({ vegType }),
  setHasOffers: (hasOffers) => set({ hasOffers }),
  setMaxDeliveryTime: (maxDeliveryTime) => set({ maxDeliveryTime }),
  setSortBy: (sortBy) => set({ sortBy }),

  resetFilters: () => set({ ...defaultFilters, searchQuery: get().searchQuery }),
}));