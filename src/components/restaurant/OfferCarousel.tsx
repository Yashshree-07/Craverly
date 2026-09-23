import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Tag, Percent, BadgePercent, Gift } from "lucide-react";
import { mockRestaurants } from "../../data/mockRestaurants";
import { cn } from "../../lib/utils";

const offerTones = [
  {
    gradient: "from-[#0b1f5e] to-[#050d2e]",
    chip: "bg-white/20",
  },
  {
    gradient: "from-[#12296f] to-[#08153d]",
    chip: "bg-white/20",
  },
  {
    gradient: "from-[#0e2468] via-[#071238] to-[#03081f]",
    chip: "bg-white/20",
  },
];

const offerIcons = [Tag, Percent, BadgePercent, Gift];

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  code?: string;
}

export function OfferCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<number | null>(null);

  const banners: Banner[] = [
    ...mockRestaurants
      .flatMap((r) => r.offers ?? [])
      .slice(0, 3)
      .map((offer) => ({
        id: `offer-${offer.id}`,
        title: offer.description,
        subtitle: "Applied automatically at checkout",
        eyebrow: "Restaurant offer",
        code: offer.code,
      })),
    {
      id: "flat-banner",
      title: "Flat ₹100 off on orders above ₹499",
      subtitle: "Use code FLAT100 across all restaurants",
      eyebrow: "Craverly exclusive",
      code: "FLAT100",
    },
    {
      id: "new-user-banner",
      title: "50% off your first order",
      subtitle: "New to Craverly? Save big today.",
      eyebrow: "First order",
      code: "FIRST50",
    },
  ];

  const total = banners.length;

  const goTo = (index: number) => {
    setCurrent((index + total) % total);
  };

  const restartTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => goTo(current + 1), 5000);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div
        className="relative h-40 md:h-48 rounded-2xl overflow-hidden shadow-lg"
        onMouseEnter={() => timerRef.current && window.clearTimeout(timerRef.current)}
        onMouseLeave={restartTimer}
      >
        {banners.map((banner, index) => {
          const Icon = offerIcons[index % offerIcons.length];
          const tone = offerTones[index % offerTones.length];
          const isActive = index === current;

          return (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
                tone.gradient,
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
                <p className={cn("inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-white/90 px-2 py-0.5 rounded-md w-fit", tone.chip)}>
                  <Icon size={12} /> {banner.eyebrow}
                </p>
                <h3 className="text-white font-bold text-xl md:text-3xl mt-2 max-w-md leading-tight">
                  {banner.title}
                </h3>
                <p className="text-white/85 text-sm mt-1">{banner.subtitle}</p>
                {banner.code && (
                  <span className="mt-3 px-3 py-1 rounded-lg bg-white/90 text-primary-700 font-mono font-bold text-sm w-fit tracking-widest">
                    {banner.code}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Arrows */}
        <button
          onClick={() => goTo(current - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/25 text-white backdrop-blur hover:bg-white/40 flex items-center justify-center transition-colors"
          aria-label="Previous offer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => goTo(current + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/25 text-white backdrop-blur hover:bg-white/40 flex items-center justify-center transition-colors"
          aria-label="Next offer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to offer ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}