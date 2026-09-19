import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getRestaurantById } from "../data/mockRestaurants";
import type { Restaurant } from "../types/restaurant";

const MAX_VIEWED = 6;
const STORAGE_KEY = "craverly-recently-viewed";

export function useRecentlyViewed() {
  const [ids, setIds] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const add = useCallback(
    (restaurantId: string) => {
      setIds((prev) =>
        [restaurantId, ...prev.filter((id) => id !== restaurantId)].slice(
          0,
          MAX_VIEWED
        )
      );
    },
    [setIds]
  );

  const restaurants = ids
    .map((id) => getRestaurantById(id))
    .filter((r): r is Restaurant => r !== undefined);

  return { add, restaurants };
}