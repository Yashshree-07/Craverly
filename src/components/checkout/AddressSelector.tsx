import { useState } from "react";
import { MapPin, Plus, Home, Briefcase, MoreHorizontal } from "lucide-react";
import type { Address } from "../../types/order";
import { useUserStore } from "../../store/userStore";
import { cn } from "../../lib/utils";
import { AddAddressModal } from "./AddAddressModal";

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelect: (address: Address) => void;
}

const labelIcons = {
  Home: Home,
  Work: Briefcase,
  Other: MoreHorizontal,
};

export function AddressSelector({ selectedAddressId, onSelect }: AddressSelectorProps) {
  const { user } = useUserStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const addresses = user?.addresses ?? [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin size={18} /> Delivery address
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
        >
          <Plus size={14} /> Add new
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No saved addresses. Add one to continue.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => {
            const Icon = labelIcons[address.label];
            const isSelected = selectedAddressId === address.id;

            return (
              <label
                key={address.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/10"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="address"
                  checked={isSelected}
                  onChange={() => onSelect(address)}
                  className="mt-1 accent-primary-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className="text-gray-500" />
                    <span className="font-medium text-sm">{address.label}</span>
                    {address.isDefault && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {address.fullAddress}
                  </p>
                  {address.landmark && (
                    <p className="text-xs text-gray-400">
                      Landmark: {address.landmark}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddAddressModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}