import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useFilterStore } from "../../store/filterStore";
import { useGeolocation } from "../../hooks/useGeolocation";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const { requestLocation, isLoading, error } = useGeolocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
    navigate("/restaurants");
  };

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
          Craving something delicious?
        </h1>
        <p className="text-primary-100 mb-8">
          Order food from the best restaurants near you
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl sm:rounded-full p-2 shadow-xl"
        >
          <button
            type="button"
            onClick={requestLocation}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 text-sm font-medium border-b sm:border-b-0 sm:border-r border-gray-200 whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MapPin size={16} className="text-primary-600" />
            )}
            {isLoading ? "Locating..." : "Detect location"}
          </button>

          <div className="flex items-center flex-1 gap-2 px-3">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for restaurant or dish"
              className="w-full py-2.5 text-sm text-gray-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Search
          </button>
        </form>

        {error && (
          <p className="text-primary-100 text-xs mt-2">
            Couldn't get location — you can still search manually.
          </p>
        )}
      </div>
    </div>
  );
}