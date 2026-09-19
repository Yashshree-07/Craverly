import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, ChevronDown, X } from "lucide-react";
import { useLocationStore } from "../../store/locationStore";
import { CITIES } from "../../data/locations";
import { cn } from "../../lib/utils";

export function LocationSelector() {
  const { city, area, label, detect, setCity, setArea, isLoading, isDetected } =
    useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setArea("");
  };

  const handleAreaSelect = (selectedArea: string) => {
    setArea(selectedArea);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="hidden md:flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors"
        aria-label="Change location"
      >
        <MapPin size={16} />
        <span className="max-w-[140px] truncate">{label()}</span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Set your location</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close location picker"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={detect}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors mb-4"
          >
            <LocateFixed
              size={16}
              className={cn(isLoading && "animate-spin")}
            />
            {isLoading
              ? "Locating..."
              : isDetected
                ? "Re-detect my location"
                : "Use my location"}
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
            City
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CITIES.map((c) => (
              <button
                key={c.city}
                onClick={() => handleCitySelect(c.city)}
                className={cn(
                  "px-3 py-1 rounded-full border text-xs transition-colors",
                  city === c.city
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-gray-300 dark:border-gray-700 hover:border-primary-500"
                )}
              >
                {c.city}
              </button>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
            Area
          </p>
          <div className="flex flex-wrap gap-2">
            {(CITIES.find((c) => c.city === city)?.areas ?? []).map(
              (a) => (
                <button
                  key={a}
                  onClick={() => handleAreaSelect(a)}
                  className={cn(
                    "px-3 py-1 rounded-full border text-xs transition-colors",
                    area === a
                      ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900"
                      : "border-gray-300 dark:border-gray-700 hover:border-primary-500"
                  )}
                >
                  {a}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}