import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, User, X, Moon, Sun, Menu, Heart, Flame } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import { useFilterStore } from "../../store/filterStore";
import { CartDrawer } from "../cart/CartDrawer";
import { LocationSelector } from "./LocationSelector";
import { SearchAutocomplete } from "../restaurant/SearchAutocomplete";

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({ isDarkMode, onToggleDarkMode }: NavbarProps) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");

  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user } = useUserStore();
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);

  const handleSearchSubmit = (searchQuery: string) => {
    setSearchQuery(searchQuery);
    navigate("/restaurants");
    setMobileMenuOpen(false);
  };

  const searchPillClassName =
    "flex items-center rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pl-3 pr-1";

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <Flame size={22} className="text-peach-500 fill-peach-500" />
            <span className="text-2xl font-bold text-primary-600">Craverly</span>
          </Link>

          <LocationSelector />

          <SearchAutocomplete
            value={desktopSearch}
            onChange={setDesktopSearch}
            onSubmit={handleSearchSubmit}
            className={`hidden md:flex flex-1 max-w-md mx-4 ${searchPillClassName}`}
          />

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/favorites"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Favorites"
            >
              <Heart size={20} />
            </Link>

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
                <span className="absolute -top-1 -right-1 bg-peach-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
            <SearchAutocomplete
              value={mobileSearch}
              onChange={setMobileSearch}
              onSubmit={handleSearchSubmit}
              className={searchPillClassName}
            />

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
                  <span className="absolute top-0 right-4 bg-peach-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <Link
                to="/favorites"
                className="flex flex-col items-center gap-1 p-2 text-xs"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={20} />
                Favorites
              </Link>

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