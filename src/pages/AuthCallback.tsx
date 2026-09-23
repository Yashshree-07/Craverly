import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { fetchProfile } from "../lib/authService";
import { useUserStore } from "../store/userStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);

  useEffect(() => {
    if (!supabase) {
      navigate("/");
      return;
    }

    // supabase-js stores the session from the OAuth redirect; hydrate it into the store.
    void supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      const user = await fetchProfile(userId);
      if (user) login(user);
      navigate(user ? "/" : "/login");
    });
  }, [login, navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-sm text-gray-500">Finishing sign-in…</p>
    </div>
  );
}