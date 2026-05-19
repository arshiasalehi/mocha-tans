"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { t } from "@/lib/i18n";
import { useCart } from "@/components/providers/cart-provider";

export function SiteHeader() {
  const { locale, setLocale } = useLocale();
  const copy = t(locale);
  const { items } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-[#fdf9f4]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="font-serif text-2xl font-bold text-[#6e4800]">
          {copy.brand}
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-zinc-700 md:flex">
          <Link href="/services">{copy.nav.services}</Link>
          <Link href="/booking">{copy.nav.booking}</Link>
          <Link href="/shop">{copy.nav.shop}</Link>
          <Link href="/bundles">{copy.nav.bundles}</Link>
          <Link href="/gallery">{copy.nav.gallery}</Link>
          <Link href="/reviews">{copy.nav.reviews}</Link>
          <Link href="/faq">{copy.nav.faq}</Link>
          <Link href="/contact">{copy.nav.contact}</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-[#8e5e01] px-3 py-1 text-xs font-semibold text-[#8e5e01]"
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>
          <Link href="/account" className="rounded-full border border-zinc-300 px-3 py-1 text-sm">
            {copy.nav.account}
          </Link>
          <Link href="/cart" className="rounded-full bg-[#8e5e01] px-3 py-1 text-sm text-white">
            Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
          </Link>
        </div>
      </div>
    </header>
  );
}
