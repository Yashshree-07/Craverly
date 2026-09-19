import { Star, ThumbsUp } from "lucide-react";
import type { Review } from "../../types/restaurant";
import { formatDate } from "../../lib/utils";

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

export function ReviewsList({ reviews, averageRating, totalCount }: ReviewsListProps) {
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

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-5 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                  {review.userName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{review.userName}</p>
                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 my-1.5">
                <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  <Star size={10} className="fill-white" />
                  {review.rating}
                </div>
              </div>

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

              <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 mt-2">
                <ThumbsUp size={12} /> Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}