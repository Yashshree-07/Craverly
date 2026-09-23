import { supabase, isSupabaseEnabled } from "./supabaseClient";
import * as mockAuth from "./mockAuth";
import type { User } from "../types/user";
import type { Address } from "../types/order";

export type AuthResult = {
  success: boolean;
  message: string;
  user?: User;
};

function mapProfile(row: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  addresses: Address[];
  favorite_restaurant_ids: string[];
  favorite_menu_item_ids: string[];
  created_at: string;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    avatar: row.avatar_url ?? undefined,
    addresses: row.addresses ?? [],
    favoriteRestaurantIds: row.favorite_restaurant_ids ?? [],
    favoriteMenuItemIds: row.favorite_menu_item_ids ?? [],
    createdAt: row.created_at,
  };
}

export async function fetchProfile(userId: string): Promise<User | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data);
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { success: false, message: error.message };
    if (!data.user) return { success: false, message: "Sign up failed, please try again" };

    // Trigger creates the profile; a couple retries cover propagation latency.
    let user: User | null = null;
    for (let attempt = 0; attempt < 3 && !user; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      user = await fetchProfile(data.user.id);
    }

    if (user) return { success: true, message: "Account created successfully", user };
    return { success: true, message: "Account created. Please confirm your email.", user: undefined };
  }

  const result = mockAuth.signupUser(name, email, password);
  return result;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    if (!data.user) return { success: false, message: "Login failed, please try again" };

    const user = await fetchProfile(data.user.id);
    if (user) return { success: true, message: "Logged in successfully", user };
    return { success: false, message: "Could not load your profile" };
  }

  const result = mockAuth.loginUser(email, password);
  return result;
}

export async function loginWithGoogle(): Promise<AuthResult> {
  if (!supabase) return { success: false, message: "Google sign-in is not enabled yet" };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Redirecting to Google…" };
}

export async function logout(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function updateProfile(updates: Partial<User>): Promise<void> {
  if (!supabase) {
    // Mirror local profile updates into the mock "users" table.
    const persisted = localStorage.getItem("craverly-user");
    if (!persisted) return;
    try {
      const user = JSON.parse(persisted).state?.user as User | undefined;
      if (user) mockAuth.syncUserToStorage({ ...user, ...updates });
    } catch {
      // ignore malformed local storage
    }
    return;
  }

  const profileFields: Record<string, unknown> = {};
  if ("name" in updates) profileFields.name = updates.name;
  if ("phone" in updates) profileFields.phone = updates.phone ?? null;
  if ("avatar" in updates) profileFields.avatar_url = updates.avatar;
  if ("addresses" in updates) profileFields.addresses = updates.addresses;
  if ("favoriteRestaurantIds" in updates) {
    profileFields.favorite_restaurant_ids = updates.favoriteRestaurantIds;
  }
  if ("favoriteMenuItemIds" in updates) {
    profileFields.favorite_menu_item_ids = updates.favoriteMenuItemIds;
  }

  await supabase.from("profiles").upsert(
    { id: updates.id, ...profileFields },
    { onConflict: "id" }
  );
}

type AuthChangeHandler = (user: User | null) => void;

export function onAuthStateChange(handler: AuthChangeHandler): () => void {
  if (!supabase) return () => {};

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id;
    if (!userId) {
      handler(null);
      return;
    }
    void fetchProfile(userId).then((user) => handler(user));
  });

  return () => data.subscription.unsubscribe();
}

export function isGoogleAuthEnabled(): boolean {
  return isSupabaseEnabled;
}