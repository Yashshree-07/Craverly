import { supabase } from "./supabaseClient";
import type { Review } from "../types/restaurant";

interface ReviewRow {
  id: string;
  restaurant_id: string;
  menu_item_id: string | null;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string;
  photo_url: string | null;
  helpful_count: number;
  created_at: string;
}

export type NewReviewInput = {
  restaurantId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  photo?: string;
};

function mapRowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id ?? "guest",
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    photos: row.photo_url ? [row.photo_url] : undefined,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at,
    ownerReply: undefined,
  };
}

export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ReviewRow[]).map(mapRowToReview);
}

export async function uploadReviewPhoto(
  dataUrl: string,
  restaurantId: string
): Promise<string | null> {
  if (!supabase) return null;

  const base64 = dataUrl.split(",")[1];
  if (!base64) return null;

  const extension = dataUrl.includes("image/png") ? "png" : "jpg";
  const path = `${restaurantId}/review-${Date.now()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("review-photos")
    .upload(
      path,
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      { contentType: dataUrl.includes("image/png") ? "image/png" : "image/jpeg" }
    );

  if (error) {
    console.warn("uploadReviewPhoto failed:", error.message);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from("review-photos")
    .getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

export async function insertReview(
  input: NewReviewInput
): Promise<Review | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      restaurant_id: input.restaurantId,
      menu_item_id: null,
      user_id: input.userId ?? null,
      user_name: input.userName,
      rating: input.rating,
      comment: input.comment,
      photo_url: input.photo ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.warn("insertReview failed:", error?.message);
    return null;
  }

  return mapRowToReview(data as ReviewRow);
}

export async function markHelpfulRemote(reviewId: string, helpful: boolean): Promise<void> {
  if (!supabase) return;
  if (helpful) {
    await supabase.from("review_helpful").insert({ review_id: reviewId });
  } else {
    await supabase
      .from("review_helpful")
      .delete()
      .eq("review_id", reviewId);
  }
}