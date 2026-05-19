"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mocha-cart";
const CART_EVENT = "mocha-cart-change";
const EMPTY_CART: CartItem[] = [];

let cachedRaw: string | null | undefined;
let cachedItems: CartItem[] = EMPTY_CART;

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return EMPTY_CART;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_CART;

    return parsed
      .map((entry) => {
        if (
          typeof entry === "object" &&
          entry !== null &&
          "productId" in entry &&
          "quantity" in entry &&
          typeof entry.productId === "string" &&
          typeof entry.quantity === "number"
        ) {
          return {
            productId: entry.productId,
            quantity: Math.max(1, Math.floor(entry.quantity)),
          } satisfies CartItem;
        }

        return null;
      })
      .filter((value): value is CartItem => Boolean(value));
  } catch {
    return EMPTY_CART;
  }
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  cachedItems = parseCart(raw);
  return cachedItems;
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedItems = items;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CART_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CART_EVENT, handler);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY_CART);

  const setItems = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    const next = updater(readCart());
    writeCart(next);
  }, []);

  const addItem = useCallback(
    (productId: string, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (!existing) return [...prev, { productId, quantity }];
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
    },
    [removeItem, setItems],
  );

  const clear = useCallback(() => {
    writeCart(EMPTY_CART);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clear }),
    [items, addItem, removeItem, updateQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
