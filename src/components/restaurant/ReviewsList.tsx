import { useState, useRef } from "react";
import { Star, ThumbsUp, Camera, ImagePlus, X, Loader2 } from "lucide-react";
import type { Review } from "../../types/restaurant";
import { formatDate, cn } from "../../lib/utils";
import { useReviewStore } from "../../store/reviewStore";
import { useUserStore } from "../../store/userStore";
import { toast } from "sonner";

interface ReviewsListProps {
  reviews: Review[];
  restaurantId: string;
  averageRating: number;
  totalCount: number;
}

export function ReviewsList({
  reviews,
  restaurantId,
  averageRating,
  totalCount,
}: ReviewsListProps) {
  const { helpfulReviewIds, toggleHelpful } = useReviewStore();

  return (
    <div className="py-6 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-600 text-white font-bold text-lg px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Star size={16} className="fill-white" />
          {averageRating.toFixed(1)}
        </div>
        <div>
          <p className="font-semibold text-sm">{totalCount} ratings</p>
        </div>
      </div>

      <ReviewForm restaurantId={restaurantId} />

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const isHelpful = helpfulReviewIds.includes(review.id);
            return (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                    {(review.userName ?? "G").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.userName ?? "Guest"}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 my-1.5">
                  <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    <Star size={10} className="fill-white" />
                    {review.rating}
                  </div>
                </div>

                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 my-2 overflow-x-auto">
                    {review.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Review photo ${i + 1}`}
                        className="w-24 h-24 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>

                {review.ownerReply && (
                  <div className="mt-2 ml-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Restaurant response
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {review.ownerReply.text}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => toggleHelpful(review.id)}
                  aria-pressed={isHelpful}
                  className={cn(
                    "flex items-center gap-1 text-xs mt-2 transition-colors",
                    isHelpful
                      ? "text-primary-600 font-semibold"
                      : "text-gray-500 hover:text-primary-600"
                  )}
                >
                  <ThumbsUp size={12} className={isHelpful ? "fill-primary-600" : ""} />
                  Helpful ({review.helpfulCount})
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ restaurantId }: { restaurantId: string }) {
  const addReview = useReviewStore((state) => state.addReview);
  const { user, isAuthenticated } = useUserStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = rating > 0 && comment.trim().length > 0 && !isSubmitting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Photo must be under 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addReview({
        restaurantId,
        userId: user?.id ?? "guest",
        userName: user?.name ?? "Guest",
        rating,
        comment: comment.trim(),
        photos: photos.length > 0 ? photos : undefined,
      });
      toast.success("Thanks for your review!");
      setRating(0);
      setComment("");
      setPhotos([]);
      setIsOpen(false);
      setIsSubmitting(false);
    }, 600);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 transition-colors mb-6"
      >
        <Camera size={16} /> Write a review
        {!isAuthenticated && <span className="text-xs text-gray-400">(as guest)</span>}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm">Share your experience</p>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label="Close review form"
        >
          <X size={16} />
        </button>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-1 mb-3" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(value)}
            className="p-0.5"
          >
            <Star
              size={26}
              className={cn(
                "transition-colors",
                value <= (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        ))}
        <span className="text-sm text-gray-500 ml-2">
          {rating > 0 ? `${rating}/5` : "Tap to rate"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="How was the food and delivery?"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3"
      />

      {/* Photo upload */}
      <div className="flex items-center gap-2 mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:border-primary-500 transition-colors"
        >
          <ImagePlus size={14} /> Add photo
        </button>
        {photos.map((photo, i) => (
          <div key={i} className="relative">
            <img src={photo} alt={`Upload ${i + 1}`} className="w-12 h-12 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5"
              aria-label="Remove photo"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
        Submit review
      </button>
    </form>
  );
}