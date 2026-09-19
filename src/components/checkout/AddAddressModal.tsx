import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../common/Button";
import { useUserStore } from "../../store/userStore";
import { toast } from "sonner";

const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  fullAddress: z.string().min(10, "Please enter a complete address"),
  landmark: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddAddressModalProps {
  onClose: () => void;
}

export function AddAddressModal({ onClose }: AddAddressModalProps) {
  const addAddress = useUserStore((state) => state.addAddress);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "Home" },
  });

  const onSubmit = (data: AddressFormData) => {
    setIsSubmitting(true);

    // Mock lat/lng — in a real app you'd geocode the address
    addAddress({
      label: data.label,
      fullAddress: data.fullAddress,
      landmark: data.landmark,
      latitude: 13.0827 + (Math.random() - 0.5) * 0.05,
      longitude: 80.2707 + (Math.random() - 0.5) * 0.05,
      isDefault: false,
    });

    toast.success("Address added");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add new address</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Label</label>
            <div className="flex gap-2">
              {(["Home", "Work", "Other"] as const).map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 cursor-pointer has-[:checked]:bg-primary-600 has-[:checked]:text-white has-[:checked]:border-primary-600 text-sm"
                >
                  <input
                    type="radio"
                    value={label}
                    {...register("label")}
                    className="hidden"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Full address
            </label>
            <textarea
              {...register("fullAddress")}
              rows={3}
              placeholder="House/Flat no, Street, Area, City, Pincode"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.fullAddress && (
              <p className="text-xs text-red-500 mt-1">
                {errors.fullAddress.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Landmark (optional)
            </label>
            <input
              type="text"
              {...register("landmark")}
              placeholder="e.g. Near City Mall"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Save address
          </Button>
        </form>
      </div>
    </div>
  );
}