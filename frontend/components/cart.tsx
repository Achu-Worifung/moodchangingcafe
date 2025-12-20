"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Cart() {
  const [hasItems, setHasItems] = useState(false);

  const checkCart = () => {
    try {
      const cart = localStorage.getItem("cart");
      setHasItems(Boolean(cart));
    } catch {
      setHasItems(false);
    }
  };

  useEffect(() => {
    // Initial check (client-only)
    checkCart();

    // Listen for changes from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        checkCart();
      }
    };

    // Optional: listen for same-tab updates
    const onCartUpdated = () => checkCart();

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart-updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={hasItems ? "Open cart (items in cart)" : "Open cart (empty)"}
      className="relative inline-flex p-1.5 rounded-full hover:bg-zinc-200 transition"
    >
      {hasItems && (
        <span
          className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"
          aria-hidden="true"
        />
      )}
      <ShoppingCart size={18} />
    </Link>
  );
}
