"use client";

import { CartProvider } from "@/components/providers/cart-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CartProvider>{children}</CartProvider>
    </LocaleProvider>
  );
}
