import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { onAuthStateChange, fetchProfile } from "../../lib/authService";
import { useUserStore } from "../../store/userStore";
import { useOrderStore } from "../../store/orderStore";
import { fetchOrders } from "../../lib/orderService";
import type { User } from "../../types/user";

function hydrate(userId: string, login: (user: User) => void) {
  void fetchProfile(userId).then((user) => {
    if (!user) return;
    login(user);
    void fetchOrders(userId).then((orders) => {
      useOrderStore.getState().mergeRemoteOrders(orders);
    });
  });
}

export function SupabaseAuthListener() {
  const login = useUserStore((state) => state.login);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!active || !userId) return;
      hydrate(userId, login);
    });

    const unsubscribe = onAuthStateChange((user) => {
      if (!active) return;
      if (user) hydrate(user.id, login);
      else logout();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [login, logout]);

  return null;
}