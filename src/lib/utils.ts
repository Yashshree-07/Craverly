import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes safely (handles conflicts)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price as Indian Rupees
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate cart totals
export function calculateCartTotals(
  subtotal: number,
  discountAmount = 0
) {
  const taxRate = 0.05; // 5% GST mock
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const packagingFee = 15;
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount =
    subtotal + taxAmount + deliveryFee + packagingFee - discountAmount;

  return {
    taxAmount,
    deliveryFee,
    packagingFee,
    totalAmount: Math.max(totalAmount, 0),
  };
}

// Generate a simple order ID
export function generateOrderId(): string {
  return `CRV${Date.now().toString().slice(-8)}`;
}

// Format date to readable string
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Debounce helper (used inside useDebounce hook too, kept here for non-hook use)
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}