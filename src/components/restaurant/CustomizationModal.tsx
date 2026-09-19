import { useState } from "react";
import { X } from "lucide-react";
import type { MenuItem } from "../../types/restaurant";
import { formatPrice } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";
import { Button } from "../common/Button";
import { toast } from "sonner";

interface CustomizationModalProps {
  item: MenuItem;
  restaurantId: string;
  onClose: () => void;
}

export function CustomizationModal({
  item,
  restaurantId,
  onClose,
}: CustomizationModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const handleSelect = (customizationId: string, optionId: string, maxSelect: number) => {
    setSelections((prev) => {
      const current = prev[customizationId] ?? [];

      if (maxSelect === 1) {
        return { ...prev, [customizationId]: [optionId] };
      }

      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];

      return { ...prev, [customizationId]: updated };
    });
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    item.customizations?.forEach((custom) => {
      const selected = selections[custom.id] ?? [];
      custom.options.forEach((opt) => {
        if (selected.includes(opt.id)) total += opt.priceModifier;
      });
    });
    return total;
  };

  const allRequiredSelected =
    item.customizations?.every(
      (custom) => !custom.required || (selections[custom.id]?.length ?? 0) > 0
    ) ?? true;

  const handleAddToCart = () => {
    addItem({
      menuItemId: item.id,
      restaurantId,
      name: item.name,
      price: calculateTotalPrice(),
      quantity: 1,
      image: item.image,
      vegType: item.vegType,
      selectedCustomizations: Object.entries(selections).map(
        ([customizationId, optionIds]) => ({ customizationId, optionIds })
      ),
    });
    toast.success(`${item.name} added to cart`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-bold">{item.name}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {item.customizations?.map((custom) => (
            <div key={custom.id}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">
                  {custom.name} {custom.required && <span className="text-red-500">*</span>}
                </h4>
                <span className="text-xs text-gray-500">
                  {custom.maxSelect === 1 ? "Select 1" : `Select up to ${custom.maxSelect}`}
                </span>
              </div>

              <div className="space-y-2">
                {custom.options.map((opt) => {
                  const isSelected = selections[custom.id]?.includes(opt.id) ?? false;
                  return (
                    <label
                      key={opt.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-primary-400"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type={custom.maxSelect === 1 ? "radio" : "checkbox"}
                          name={custom.id}
                          checked={isSelected}
                          onChange={() =>
                            handleSelect(custom.id, opt.id, custom.maxSelect)
                          }
                          className="accent-primary-600"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {opt.priceModifier > 0 && (
                        <span className="text-sm text-gray-500">
                          +{formatPrice(opt.priceModifier)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            className="w-full"
            size="lg"
            disabled={!allRequiredSelected}
            onClick={handleAddToCart}
          >
            Add item — {formatPrice(calculateTotalPrice())}
          </Button>
        </div>
      </div>
    </div>
  );
}