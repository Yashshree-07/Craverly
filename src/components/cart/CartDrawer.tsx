import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { formatPrice, calculateCartTotals } from "../../lib/utils";
import { Button } from "../common/Button";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const { taxAmount, deliveryFee, packagingFee, totalAmount } =
    calculateCartTotals(subtotal);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-950 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} /> Your Cart
          </h2>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Clear cart"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Add items from a restaurant to get started
            </p>
            <Button className="mt-4" onClick={onClose}>
              Browse restaurants
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className="text-xs text-red-500 hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Taxes</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Delivery fee</span>
                <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Packaging fee</span>
                <span>{formatPrice(packagingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-800">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              <Link to="/checkout" onClick={onClose}>
                <Button className="w-full mt-2" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}