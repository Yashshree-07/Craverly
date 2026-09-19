import { Smartphone, CreditCard, Wallet } from "lucide-react";
import { cn } from "../../lib/utils";

type PaymentMethod = "upi" | "card" | "cod";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const methods: { value: PaymentMethod; label: string; description: string; icon: typeof Smartphone }[] = [
  {
    value: "upi",
    label: "UPI",
    description: "Pay via Google Pay, PhonePe, Paytm",
    icon: Smartphone,
  },
  {
    value: "card",
    label: "Credit/Debit Card",
    description: "Visa, Mastercard, RuPay accepted",
    icon: CreditCard,
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Wallet,
  },
];

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="font-semibold mb-3">Payment method</h3>

      <div className="space-y-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.value;

          return (
            <label
              key={method.value}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isSelected
                  ? "border-primary-600 bg-primary-50 dark:bg-primary-900/10"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="payment"
                checked={isSelected}
                onChange={() => onSelect(method.value)}
                className="accent-primary-600"
              />
              <Icon size={20} className="text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-sm">{method.label}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}