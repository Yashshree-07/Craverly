import { supabase, isSupabaseEnabled } from "./supabaseClient";
import { generateInviteCode, type GroupSession, type GroupOrderItem } from "../types/group";
import type { CartItem } from "../types/order";

interface SessionRow {
  id: string;
  invite_code: string;
  name: string;
  host_user_id: string;
  host_name: string;
  restaurant_id: string;
  restaurant_name: string;
  status: "open" | "ordered" | "closed";
  items: { id: string; user_id: string; user_name: string; item: CartItem }[];
}

function mapRow(row: SessionRow): GroupSession {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    name: row.name,
    hostUserId: row.host_user_id,
    hostName: row.host_name,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    status: row.status,
    createdAt: new Date().toISOString(),
    items: row.items.map((it) => ({
      id: it.id,
      userId: it.user_id,
      userName: it.user_name,
      item: it.item,
    })),
  };
}

export async function createGroupSession(input: {
  restaurantId: string;
  restaurantName: string;
  hostName: string;
  name?: string;
}): Promise<GroupSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("group_sessions")
    .insert({
      invite_code: generateInviteCode(),
      name: input.name ?? "Craverly group order",
      host_user_id: (await supabase.auth.getUser()).data.user?.id ?? "anon",
      host_name: input.hostName,
      restaurant_id: input.restaurantId,
      restaurant_name: input.restaurantName,
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.warn("createGroupSession failed:", error?.message);
    return null;
  }
  return mapRow(data as SessionRow);
}

export async function fetchGroupSession(code: string): Promise<GroupSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("group_sessions")
    .select("*, items:group_session_items(*)")
    .eq("invite_code", code.toUpperCase())
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn("fetchGroupSession failed:", error?.message);
    return null;
  }
  return mapRow(data as SessionRow);
}

export async function addGroupItem(
  sessionId: string,
  item: CartItem,
  userName: string
): Promise<GroupOrderItem | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("group_session_items")
    .insert({
      session_id: sessionId,
      user_id: (await supabase.auth.getUser()).data.user?.id ?? "anon",
      user_name: userName,
      item,
      cost: item.price * item.quantity,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.warn("addGroupItem failed:", error?.message);
    return null;
  }
  return {
    id: data.id,
    userId: data.user_id,
    userName: data.user_name,
    item: data.item,
  };
}

export async function removeGroupItem(itemId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("group_session_items").delete().eq("id", itemId);
}

export async function updateGroupStatus(
  code: string,
  status: "open" | "ordered" | "closed"
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("group_sessions")
    .update({ status })
    .eq("invite_code", code.toUpperCase());
}

export function subscribeToGroup(
  code: string,
  onEvent: (items: GroupOrderItem[]) => void
): () => void {
  if (!isSupabaseEnabled || !supabase) return () => {};

  const channel = supabase
    .channel(`group-${code}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "group_session_items",
      },
      () => {
        void fetchGroupSession(code).then((session) => {
          if (session) onEvent(session.items);
        });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "group_session_items",
      },
      () => {
        void fetchGroupSession(code).then((session) => {
          if (session) onEvent(session.items);
        });
      }
    )
    .subscribe();

  return () => {
    void supabase?.removeChannel(channel);
  };
}