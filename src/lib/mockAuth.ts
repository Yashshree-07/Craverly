import type { User } from "../types/user";

interface StoredUser extends User {
  passwordHash: string; // NOT real security — mock only, never do this in production
}

const USERS_KEY = "craverly-registered-users";

// Extremely basic obfuscation, NOT real hashing — this is a frontend-only mock.
// Replace this entire file with real Supabase/Firebase auth calls later.
function fakeHash(password: string): string {
  return btoa(password.split("").reverse().join(""));
}

function getStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signupUser(
  name: string,
  email: string,
  password: string
): { success: boolean; message: string; user?: User } {
  const users = getStoredUsers();

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: "An account with this email already exists" };
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    passwordHash: fakeHash(password),
    addresses: [],
    favoriteRestaurantIds: [],
    favoriteMenuItemIds: [],
    createdAt: new Date().toISOString(),
  };

  saveStoredUsers([...users, newUser]);

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return { success: true, message: "Account created successfully", user: userWithoutPassword };
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; message: string; user?: User } {
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!found) {
    return { success: false, message: "No account found with this email" };
  }

  if (found.passwordHash !== fakeHash(password)) {
    return { success: false, message: "Incorrect password" };
  }

  const { passwordHash: _, ...userWithoutPassword } = found;
  return { success: true, message: "Logged in successfully", user: userWithoutPassword };
}

// Keeps the "registered users" table in sync when userStore mutates the
// logged-in user (e.g. adding an address). Call this after any user update.
export function syncUserToStorage(updatedUser: User): void {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index === -1) return;

  users[index] = { ...users[index], ...updatedUser };
  saveStoredUsers(users);
}