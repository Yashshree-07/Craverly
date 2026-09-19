import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

const MAX_RECENT = 6;
const STORAGE_KEY = "craverly-recent-searches";

export function useRecentSearches() {
  const [recent, setRecent] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const addRecent = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      setRecent((prev) =>
        [q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())].slice(
          0,
          MAX_RECENT
        )
      );
    },
    [setRecent]
  );

  const removeRecent = useCallback(
    (query: string) => {
      setRecent((prev) => prev.filter((p) => p !== query));
    },
    [setRecent]
  );

  const clearRecent = useCallback(() => setRecent([]), [setRecent]);

  return { recent, addRecent, removeRecent, clearRecent };
}