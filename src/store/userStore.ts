import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user";
import type { Address } from "../types/order";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  toggleFavoriteRestaurant: (restaurantId: string) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  removeAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      toggleFavoriteRestaurant: (restaurantId) => {
        const user = get().user;
        if (!user) return;

        const isFavorite = user.favoriteRestaurantIds.includes(restaurantId);
        const updatedFavorites = isFavorite
          ? user.favoriteRestaurantIds.filter((id) => id !== restaurantId)
          : [...user.favoriteRestaurantIds, restaurantId];

        set({ user: { ...user, favoriteRestaurantIds: updatedFavorites } });
      },

      addAddress: (address) => {
        const user = get().user;
        if (!user) return;

        const newAddress: Address = {
          ...address,
          id: `addr_${Date.now()}`,
        };

        // If it's the first address, make it default
        const isFirst = user.addresses.length === 0;
        const updatedAddresses = isFirst
          ? [{ ...newAddress, isDefault: true }]
          : [...user.addresses, newAddress];

        set({ user: { ...user, addresses: updatedAddresses } });
      },

      removeAddress: (addressId) => {
        const user = get().user;
        if (!user) return;

        set({
          user: {
            ...user,
            addresses: user.addresses.filter((a) => a.id !== addressId),
          },
        });
      },

      setDefaultAddress: (addressId) => {
        const user = get().user;
        if (!user) return;

        set({
          user: {
            ...user,
            addresses: user.addresses.map((a) => ({
              ...a,
              isDefault: a.id === addressId,
            })),
          },
        });
      },
    }),
    { name: "craverly-user" }
  )
);