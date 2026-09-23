import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  Copy,
  Link2,
  Plus,
  Minus,
  X,
  Users,
  ShoppingCart,
  Check,
} from "lucide-react";
import { useGroupStore } from "../store/groupStore";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { useGroupRealtime } from "../hooks/useGroupRealtime";
import { getMenuByRestaurantId } from "../data/mockRestaurants";
import { isSupabaseEnabled } from "../lib/supabaseClient";
import { formatPrice } from "../lib/utils";
import { toast } from "sonner";

export default function GroupOrderRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const normalized = (code ?? "").toUpperCase();

  const session = useGroupStore((state) => state.sessions[normalized]);
  const joinSession = useGroupStore((state) => state.joinSession);
  const addDish = useGroupStore((state) => state.addDish);
  const removeDish = useGroupStore((state) => state.removeDish);
  const closeSession = useGroupStore((state) => state.closeSession);
  const { user, isAuthenticated } = useUserStore();
  const addItem = useCartStore((state) => state.addItem);

  const [notFound, setNotFound] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useGroupRealtime(normalized);

  useEffect(() => {
    if (!normalized) return;
    if (session) return;
    void joinSession(normalized).then((result) => {
      if (!result) setNotFound(true);
    });
  }, [normalized, session, joinSession]);

  const userName = user?.name ?? "Guest";

  const menuItems = useMemo(
    () => (session ? getMenuByRestaurantId(session.restaurantId) : []),
    [session]
  );

  const totals = useMemo(() => {
    const perPerson = new Map<string, number>();
    let total = 0;
    const participants = new Set<string>();

    for (const entry of session?.items ?? []) {
      const cost = entry.item.price * entry.item.quantity;
      total += cost;
      perPerson.set(entry.userName, (perPerson.get(entry.userName) ?? 0) + cost);
      participants.add(entry.userName);
    }

    const participantCount = Math.max(participants.size, 1);
    return {
      total,
      perPerson: [...perPerson.entries()].sort((a, b) => b[1] - a[1]),
      participantCount,
      equalSplit: Math.round(total / participantCount),
      participants: [...participants],
    };
  }, [session]);

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Group order not found</h1>
        <p className="text-sm text-gray-500 mt-2">
          Check the invite code and try again.
        </p>
        <Link
          to="/group-order"
          className="inline-block mt-4 text-primary-600 underline"
        >
          Start your own group order
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-sm text-gray-500">Loading group order…</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(session.inviteCode);
    toast.success("Invite code copied");
  };

  const handleCopyLink = () => {
    void navigator.clipboard
      .writeText(`${window.location.origin}/group-order/${session.inviteCode}`)
      .then(() =>
        toast.success("Invite link copied — share it with friends")
      )
      .catch(() => toast.error("Couldn't copy the link"));
  };

  const handleRemove = (itemId: string) => {
    void removeDish(normalized, itemId);
  };

  const addSelectedItem = (menuItemId: string) => {
    const item = menuItems.find((m) => m.id === menuItemId);
    const qty = quantities[menuItemId] ?? 1;
    if (!item || qty <= 0) return;

    void addDish(
      normalized,
      {
        menuItemId: item.id,
        restaurantId: session.restaurantId,
        name: item.name,
        price: item.price,
        quantity: qty,
        image: item.image,
        vegType: item.vegType,
      },
      userName
    );
    setQuantities((prev) => ({ ...prev, [menuItemId]: 1 }));
    toast.success(`${item.name} added to group order`);
  };

  const handlePlaceOrder = () => {
    if (session.status !== "open") return;

    for (const entry of session.items) {
      addItem(entry.item);
    }
    void closeSession(normalized);
    toast.success("Group order placed — review it in your cart");
    navigate("/cart");
  };

  const isHost =
    !isSupabaseEnabled ||
    (user?.id === session.hostUserId || user?.name === session.hostName);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link
        to="/group-order"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <ChevronLeft size={16} /> Back
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {session.name}
            </h1>
            <p className="text-sm text-gray-500">
              {session.restaurantName} · hosted by {session.hostName}
            </p>
          </div>
          <span
            className={
              session.status === "open"
                ? "text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full"
                : "text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full"
            }
          >
            {session.status}
          </span>
        </div>

        <div className="mt-3 bg-gray-50 dark:bg-gray-950 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Invite code:</span>
            <span className="font-mono font-bold text-lg tracking-widest text-primary-600">
              {session.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="ml-auto p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
              aria-label="Copy invite code"
              title="Copy invite code"
            >
              <Copy size={16} />
            </button>
          </div>
          <button
            onClick={handleCopyLink}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Link2 size={15} /> Copy invite link
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Send this link — friends tap it, add their own dishes, and everyone's
          share gets split automatically.
        </p>
      </div>

      {/* Shared items */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users size={18} /> Shared cart
          </h2>
          {session.status === "open" && (
            <button
              onClick={() => {
                if (isSupabaseEnabled && !isAuthenticated) {
                  toast.error("Login to add dishes to a group order");
                  navigate("/login", { state: { from: `/group-order/${normalized}` } });
                  return;
                }
                setShowPicker(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus size={14} /> Add dish
            </button>
          )}
        </div>

        {session.items.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No dishes yet. Be the first to add one!
          </p>
        ) : (
          <div className="space-y-4">
            {totals.participants.map((participant) => {
              const personItems = session.items.filter(
                (i) => i.userName === participant
              );
              if (personItems.length === 0) return null;
              return (
                <div key={participant} className="border-t border-gray-100 dark:border-gray-800 pt-3 first:border-0 first:pt-0">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">
                    {participant}
                  </p>
                  {personItems.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 py-1"
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                        {entry.item.quantity}× {entry.item.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatPrice(entry.item.price * entry.item.quantity)}
                      </span>
                      {(entry.userId === user?.id || isHost) && (
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500"
                          aria-label={`Remove ${entry.item.name}`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Split bill */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Split the bill
        </h2>
        <div className="space-y-1.5">
          {totals.perPerson.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{name}</span>
              <span className="font-semibold">{formatPrice(value)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
          <span className="font-bold text-lg">{formatPrice(totals.total)}</span>
        </div>
        {totals.participantCount > 1 && (
          <p className="text-xs text-gray-500 mt-2">
            Even split: {formatPrice(totals.equalSplit)} each across{" "}
            {totals.participantCount} people
          </p>
        )}
      </div>

      {/* Place group order */}
      {session.status === "open" && isHost && session.items.length > 0 && (
        <button
          onClick={handlePlaceOrder}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
        >
          <ShoppingCart size={16} /> Place group order for everyone
        </button>
      )}
      {session.status === "open" && !isHost && (
        <p className="text-center text-xs text-gray-500">
          Waiting for {session.hostName} to place the order.
        </p>
      )}

      {/* Dish picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold">Add dishes from {session.restaurantName}</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close picker"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {menuItems.map((item) => {
                const qty = quantities[item.id] ?? 1;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border border-gray-200 dark:border-gray-800 rounded-xl p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, (prev[item.id] ?? 1) - 1),
                          }))
                        }
                        className="p-1 rounded-full border border-gray-300 dark:border-gray-700"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                      <button
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: (prev[item.id] ?? 1) + 1,
                          }))
                        }
                        className="p-1 rounded-full border border-gray-300 dark:border-gray-700"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => addSelectedItem(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}