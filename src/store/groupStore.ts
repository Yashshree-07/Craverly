import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../types/order";
import type { Restaurant } from "../types/restaurant";
import {
  generateInviteCode,
  type GroupSession,
  type GroupOrderItem,
} from "../types/group";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import {
  createGroupSession as createRemote,
  fetchGroupSession as fetchRemote,
  addGroupItem as addRemote,
  removeGroupItem as removeRemote,
  updateGroupStatus as updateStatusRemote,
} from "../lib/groupService";

interface GroupState {
  sessions: Record<string, GroupSession>;
  activeCode: string | null;
  setActive: (code: string | null) => void;
  createSession: (
    restaurant: Restaurant,
    hostName: string
  ) => Promise<string | null>;
  joinSession: (code: string) => Promise<GroupSession | null>;
  addDish: (code: string, item: CartItem, userName: string) => Promise<void>;
  removeDish: (code: string, itemId: string) => Promise<void>;
  mergeItems: (code: string, items: GroupOrderItem[]) => void;
  closeSession: (code: string) => Promise<void>;
}

function buildLocalSession(
  restaurant: Restaurant,
  hostName: string
): GroupSession {
  const code = generateInviteCode();
  return {
    id: `group_${Date.now()}`,
    inviteCode: code,
    name: "Craverly group order",
    hostUserId: "local",
    hostName,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    status: "open",
    createdAt: new Date().toISOString(),
    items: [],
  };
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeCode: null,

      setActive: (code) => set({ activeCode: code }),

      createSession: async (restaurant, hostName) => {
        if (isSupabaseEnabled) {
          const remote = await createRemote({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            hostName,
          });
          if (!remote) return null;

          set((state) => ({
            sessions: { ...state.sessions, [remote.inviteCode]: remote },
            activeCode: remote.inviteCode,
          }));
          return remote.inviteCode;
        }

        const session = buildLocalSession(restaurant, hostName);
        set((state) => ({
          sessions: { ...state.sessions, [session.inviteCode]: session },
          activeCode: session.inviteCode,
        }));
        return session.inviteCode;
      },

      joinSession: async (code) => {
        const normalized = code.trim().toUpperCase();
        if (isSupabaseEnabled) {
          const remote = await fetchRemote(normalized);
          if (!remote) return null;
          set((state) => ({
            sessions: { ...state.sessions, [normalized]: remote },
            activeCode: normalized,
          }));
          return remote;
        }

        const local = get().sessions[normalized];
        if (!local || local.status !== "open") return null;
        set({ activeCode: normalized });
        return local;
      },

      addDish: async (code, item, userName) => {
        const session = get().sessions[code];
        if (!session) return;

        if (isSupabaseEnabled) {
          const remote = await addRemote(session.id, item, userName);
          if (remote) {
            set((state) => ({
              sessions: {
                ...state.sessions,
                [code]: {
                  ...session,
                  items: [...session.items, remote],
                },
              },
            }));
          }
          return;
        }

        const newItem: GroupOrderItem = {
          id: `gi_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: "local",
          userName,
          item,
        };
        set((state) => ({
          sessions: {
            ...state.sessions,
            [code]: { ...session, items: [...session.items, newItem] },
          },
        }));
      },

      removeDish: async (code, itemId) => {
        const session = get().sessions[code];
        if (!session) return;

        if (isSupabaseEnabled) await removeRemote(itemId);

        set((state) => ({
          sessions: {
            ...state.sessions,
            [code]: {
              ...session,
              items: session.items.filter((i) => i.id !== itemId),
            },
          },
        }));
      },

      mergeItems: (code, items) => {
        set((state) => {
          const session = state.sessions[code];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [code]: { ...session, items },
            },
          };
        });
      },

      closeSession: async (code) => {
        const session = get().sessions[code];
        if (!session) return;

        if (isSupabaseEnabled) await updateStatusRemote(code, "ordered");

        set((state) => ({
          sessions: {
            ...state.sessions,
            [code]: { ...session, status: "ordered" },
          },
        }));
      },
    }),
    { name: "craverly-group" }
  )
);