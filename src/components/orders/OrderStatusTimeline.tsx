import { Check, Circle, ChefHat, Package, Bike, PartyPopper } from "lucide-react";
import type { OrderStatus } from "../../types/order";
import { cn } from "../../lib/utils";

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const steps: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "placed", label: "Order placed", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: Check },
  { status: "preparing", label: "Preparing your food", icon: ChefHat },
  { status: "out_for_delivery", label: "Out for delivery", icon: Bike },
  { status: "delivered", label: "Delivered", icon: PartyPopper },
];

export function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isCompleted && "bg-green-600 text-white",
                  isActive && "bg-primary-600 text-white animate-pulse",
                  isPending && "bg-gray-100 dark:bg-gray-800 text-gray-400"
                )}
              >
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[32px] transition-colors",
                    isCompleted ? "bg-green-600" : "bg-gray-200 dark:bg-gray-800"
                  )}
                />
              )}
            </div>

            <div className={cn("pb-8", index === steps.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "font-medium text-sm",
                  isActive && "text-primary-600",
                  isCompleted && "text-gray-900 dark:text-gray-100",
                  isPending && "text-gray-400"
                )}
              >
                {step.label}
              </p>
              {isActive && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Circle size={6} className="fill-primary-600 text-primary-600 animate-pulse" />
                  In progress...
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}