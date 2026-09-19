import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { LogOut, MapPin, Heart, Package, Plus } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { useOrderStore } from "../store/orderStore";
import { AddressCard } from "../components/profile/AddressCard";
import { AddAddressModal } from "../components/checkout/AddAddressModal";
import { Button } from "../components/common/Button";
import { mockRestaurants } from "../data/mockRestaurants";
import { RestaurantCard } from "../components/restaurant/RestaurantCard";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUserStore();
  const orders = useOrderStore((state) => state.orders);
  const [showAddAddress, setShowAddAddress] = useState(false);

  if (!isAuthenticated || !user) {
    navigate("/login", { state: { from: "/profile" } });
    return null;
  }

  const favoriteRestaurants = mockRestaurants.filter((r) =>
    user.favoriteRestaurantIds.includes(r.id)
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut size={14} /> Logout
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          to="/orders"
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center hover:border-primary-400 transition-colors"
        >
          <Package size={20} className="mx-auto mb-1 text-primary-600" />
          <p className="text-lg font-bold">{orders.length}</p>
          <p className="text-xs text-gray-500">Orders</p>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <Heart size={20} className="mx-auto mb-1 text-primary-600" />
          <p className="text-lg font-bold">{favoriteRestaurants.length}</p>
          <p className="text-xs text-gray-500">Favorites</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <MapPin size={20} className="mx-auto mb-1 text-primary-600" />
          <p className="text-lg font-bold">{user.addresses.length}</p>
          <p className="text-xs text-gray-500">Addresses</p>
        </div>
      </div>

      {/* Addresses */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <MapPin size={18} /> Saved addresses
          </h2>
          <button
            onClick={() => setShowAddAddress(true)}
            className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
          >
            <Plus size={14} /> Add new
          </button>
        </div>

        {user.addresses.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No saved addresses yet. Add one to speed up checkout.
          </p>
        ) : (
          <div className="space-y-2">
            {user.addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section>
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Heart size={18} /> Favorite restaurants
        </h2>

        {favoriteRestaurants.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            You haven't favorited any restaurants yet.{" "}
            <Link to="/restaurants" className="text-primary-600 underline">
              Browse restaurants
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favoriteRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      {showAddAddress && (
        <AddAddressModal onClose={() => setShowAddAddress(false)} />
      )}
    </div>
  );
}