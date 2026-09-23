import { useEffect } from "react";
import { subscribeToGroup } from "../lib/groupService";
import { useGroupStore } from "../store/groupStore";

export function useGroupRealtime(code: string | undefined) {
  const mergeItems = useGroupStore((state) => state.mergeItems);

  useEffect(() => {
    if (!code) return;
    return subscribeToGroup(code, (items) => mergeItems(code, items));
  }, [code, mergeItems]);
}