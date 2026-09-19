import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_CITY = "Chennai";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  area: string;
  isDetected: boolean;
  isLoading: boolean;
  error: string | null;
  detect: () => void;
  setCity: (city: string) => void;
  setArea: (area: string) => void;
  reset: () => void;
  label: () => string;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      latitude: null,
      longitude: null,
      city: DEFAULT_CITY,
      area: "",
      isDetected: false,
      isLoading: false,
      error: null,

      detect: () => {
        if (!navigator.geolocation) {
          set({
            error: "Geolocation is not supported by your browser",
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true, error: null });

        navigator.geolocation.getCurrentPosition(
          (position) =>
            set({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city: DEFAULT_CITY,
              area: "",
              isDetected: true,
              isLoading: false,
              error: null,
            }),
          (_error) =>
            set({
              error: "Couldn't detect location — you can still search manually.",
              isLoading: false,
            })
        );
      },

      setCity: (city) => set({ city, area: "", error: null }),

      setArea: (area) => set({ area, error: null }),

      reset: () =>
        set({
          latitude: null,
          longitude: null,
          city: DEFAULT_CITY,
          area: "",
          isDetected: false,
          isLoading: false,
          error: null,
        }),

      label: () => {
        const { city, area } = get();
        return area ? `${area}, ${city}` : city;
      },
    }),
    {
      name: "craverly-location",
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        city: state.city,
        area: state.area,
        isDetected: state.isDetected,
      }),
    }
  )
);