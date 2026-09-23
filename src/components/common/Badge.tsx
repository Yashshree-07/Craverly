import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "veg" | "nonveg" | "vegan";
  className?: string;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  warning: "bg-peach-100 text-peach-700 dark:bg-peach-900/40 dark:text-peach-400",
  veg: "bg-green-50 text-green-700 border border-green-600",
  nonveg: "bg-red-50 text-red-700 border border-red-600",
  vegan: "bg-emerald-50 text-emerald-700 border border-emerald-600",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function VegIndicator({ type }: { type: "veg" | "non-veg" | "vegan" }) {
  const colors = {
    veg: "border-green-600",
    "non-veg": "border-red-600",
    vegan: "border-emerald-600",
  };
  const dotColors = {
    veg: "bg-green-600",
    "non-veg": "bg-red-600",
    vegan: "bg-emerald-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0",
        colors[type]
      )}
      title={type}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[type])} />
    </span>
  );
}