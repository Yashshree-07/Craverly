import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Review } from "../types/restaurant";
import { mockReviews } from "../data/mockRestaurants";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import {
  fetchReviews,
  insertReview,
  uploadReviewPhoto,
  markHelpfulRemote,
} from "../lib/reviewService";

type NewReview = Omit<Review, "id" | "createdAt" | "helpfulCount">;

interface ReviewState {
  reviews: Review[];
  helpfulReviewIds: string[];
  loadReviewsForRestaurant: (restaurantId: string) => void;
  addReview: (review: NewReview) => void;
  toggleHelpful: (reviewId: string) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: mockReviews,
      helpfulReviewIds: [],

      loadReviewsForRestaurant: (restaurantId) => {
        if (!isSupabaseEnabled) return;

        void fetchReviews(restaurantId).then((remoteReviews) => {
          if (remoteReviews.length === 0) return;
          const localOthers = get().reviews.filter(
            (r) => r.restaurantId !== restaurantId
          );
          set({ reviews: [...remoteReviews, ...localOthers] });
        });
      },

      addReview: (review) => {
        const optimistic: Review = {
          ...review,
          id: `rev_${Date.now()}`,
          createdAt: new Date().toISOString(),
          helpfulCount: 0,
        };

        set({ reviews: [optimistic, ...get().reviews] });

        if (!isSupabaseEnabled) return;

        void (async () => {
          const photo =
            review.photos && review.photos.length > 0
              ? await uploadReviewPhoto(review.photos[0], review.restaurantId)
              : undefined;

          const remote = await insertReview({
            restaurantId: review.restaurantId,
            userId: review.userId === "guest" ? undefined : review.userId,
            userName: review.userName ?? "Guest",
            rating: review.rating,
            comment: review.comment,
            photo: photo ?? undefined,
          });

          if (!remote) return;

          // Replace the optimistic copy with the server row (real id + photo).
          set({
            reviews: get().reviews.map((r) =>
              r.id === optimistic.id ? remote : r
            ),
          });
        })();
      },

      toggleHelpful: (reviewId) => {
        const isHelpful = get().helpfulReviewIds.includes(reviewId);
        set({
          helpfulReviewIds: isHelpful
            ? get().helpfulReviewIds.filter((id) => id !== reviewId)
            : [...get().helpfulReviewIds, reviewId],
          reviews: get().reviews.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulCount: r.helpfulCount + (isHelpful ? -1 : 1) }
              : r
          ),
        });

        if (isSupabaseEnabled) void markHelpfulRemote(reviewId, !isHelpful);
      },
    }),
    { name: "craverly-reviews" }
  )
);