import type { CartItem } from "./order";

export interface GroupOrderItem {
  id: string;
  userId: string;
  userName: string;
  item: CartItem;
}

export interface GroupSession {
  id: string;
  inviteCode: string;
  name: string;
  hostUserId: string;
  hostName: string;
  restaurantId: string;
  restaurantName: string;
  status: "open" | "ordered" | "closed";
  createdAt: string;
  items: GroupOrderItem[];
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}