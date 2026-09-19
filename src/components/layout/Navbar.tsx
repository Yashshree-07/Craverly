import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, ShoppingCart, User, MapPin, Menu, X, Moon, Sun } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import { useFilterStore } from "../../store/filterStore";
import { CartDrawer } from "../cart/CartDrawer";

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, onToggleDarkMode }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user } = useUserStore();
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    navigate("/restaurants");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <span className="text-2xl font-bold text-primary-600">Craverly</span>
          </Link>

          <button className="hidden md:flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
            <MapPin size={16} />
            <span className="max-w-[140px] truncate">Chennai, TN</span>
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search restaurants or dishes"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <Link
              to={isAuthenticated ? "/profile" : "/login"}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User size={20} />
              <span className="text-sm font-medium hidden lg:inline">
                {isAuthenticated ? user?.name.split(" ")[0] : "Login"}
              </span>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search restaurants or dishes"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </form>

            <div className="flex items-center justify-around pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onToggleDarkMode}
                className="flex flex-col items-center gap-1 p-2 text-xs"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                Theme
              </button>

              <button
                onClick={() => {
                  setCartOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex flex-col items-center gap-1 p-2 text-xs relative"
              >
                <ShoppingCart size={20} />
                Cart
                {totalItems > 0 && (
                  <span className="absolute top-0 right-4 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <Link
                to={isAuthenticated ? "/profile" : "/login"}
                className="flex flex-col items-center gap-1 p-2 text-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={20} />
                {isAuthenticated ? "Profile" : "Login"}
              </Link>
            </div>
          </div>
        )}
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}