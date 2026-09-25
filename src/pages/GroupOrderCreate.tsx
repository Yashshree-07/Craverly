import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Users, ChevronLeft, LogIn } from "lucide-react";
import { mockRestaurants } from "../data/mockRestaurants";
import { useGroupStore } from "../store/groupStore";
import { useUserStore } from "../store/userStore";
import { isSupabaseEnabled } from "../lib/supabaseClient";

export default function GroupOrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createSession = useGroupStore((state) => state.createSession);
  const { user, isAuthenticated } = useUserStore();
  const [creating, setCreating] = useState<string | null>(null);

  const preselectedId = searchParams.get("restaurant");
  const restaurants = preselectedId
    ? mockRestaurants.filter((r) => r.id === preselectedId)
    : mockRestaurants;

  const handleCreate = async (restaurantId: string) => {
    if (isSupabaseEnabled && !isAuthenticated) {
      navigate("/login", { state: { from: `/group-order?restaurant=${restaurantId}` } });
      return;
    }

    const restaurant = mockRestaurants.find((r) => r.id === restaurantId);
    if (!restaurant) return;

    setCreating(restaurantId);
    const code = await createSession(restaurant, user?.name ?? "Guest");
    setCreating(null);

    if (code) navigate(`/group-order/${code}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeft size={16} /> Back
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Users size={20} className="text-primary-600" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {preselectedId ? "Start a group order" : "Pick a restaurant"}
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Create a shared order, invite friends with the code, and split the bill.
      </p>

      {isSupabaseEnabled && !isAuthenticated && (
        <div className="mb-6 p-4 bg-peach-50 dark:bg-peach-900/10 border border-peach-200 dark:border-peach-900 rounded-xl text-sm text-peach-800 dark:text-peach-400">
          You need to be logged in to create a group order.{" "}
          <Link to="/login" className="underline font-medium inline-flex items-center gap-1">
            <LogIn size={13} /> Login
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            onClick={() => handleCreate(restaurant.id)}
            disabled={creating !== null}
            className="text-left bg-lavender-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-primary-400 transition-colors disabled:opacity-60"
          >
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {restaurant.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {restaurant.cuisines.join(", ")} · {restaurant.deliveryTimeMinutes} min
              </p>
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {creating === restaurant.id ? "Creating…" : "Start group order →"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}