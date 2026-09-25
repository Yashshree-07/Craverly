import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";
import { useFilterStore } from "../../store/filterStore";
import { useLocationStore } from "../../store/locationStore";
import { SearchAutocomplete } from "./SearchAutocomplete";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const { detect, isLoading, error, label } = useLocationStore();

  const handleSearch = (searchQuery: string) => {
    setSearchQuery(searchQuery);
    navigate("/restaurants");
  };

  const locationLabel = label();

  return (
    <div className="bg-gradient-to-br from-primary-800 via-primary-900 to-black py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-peach-300 mb-3">
          Craving something delicious?
        </h1>
        <p className="text-primary-100 mb-8">
          Order food from the best restaurants near you
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl sm:rounded-full p-2 shadow-xl"
        >
          <button
            type="button"
            onClick={detect}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-gray-700 text-sm font-medium border-b sm:border-b-0 sm:border-r border-gray-200 whitespace-nowrap"
            title="Detect my location"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MapPin size={16} className="text-primary-600" />
            )}
            <span className="max-w-[110px] truncate">
              {isLoading
                ? "Locating..."
                : error
                  ? "Set location"
                  : locationLabel}
            </span>
          </button>

          <SearchAutocomplete
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            placeholder="Search for restaurant or dish"
            showIcon={false}
            className="flex-1 px-2"
            inputClassName="py-2 text-gray-900"
          />

          <button
            type="submit"
            className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors"
          >
            Search
          </button>
        </form>

        {(error || !isLoading) && error && (
          <p className="text-primary-100 text-xs mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}