import { Home, Briefcase, MoreHorizontal, Trash2, Star } from "lucide-react";
import type { Address } from "../../types/order";
import { useUserStore } from "../../store/userStore";
import { toast } from "sonner";

const labelIcons = { Home, Work: Briefcase, Other: MoreHorizontal };

export function AddressCard({ address }: { address: Address }) {
  const { removeAddress, setDefaultAddress } = useUserStore();
  const Icon = labelIcons[address.label];

  const handleRemove = () => {
    removeAddress(address.id);
    toast.success("Address removed");
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
      <Icon size={16} className="text-gray-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
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
      </div>
      <div className="flex gap-1 shrink-0">
        {!address.isDefault && (
          <button
            onClick={() => setDefaultAddress(address.id)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Set as default"
          >
            <Star size={14} className="text-gray-400" />
          </button>
        )}
        <button
          onClick={handleRemove}
          className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Remove address"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}