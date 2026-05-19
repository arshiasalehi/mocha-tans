"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

type CheckoutResponse =
  | { ok: true; data: { checkoutUrl: string } }
  | { ok: false; code: string; message: string };

export function CartPageClient({ products }: { products: Product[] }) {
  const { items, updateQuantity, removeItem } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexed = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const rows = items
    .map((item) => ({
      item,
      product: indexed.get(item.productId),
    }))
    .filter((row): row is { item: (typeof items)[number]; product: Product } => Boolean(row.product));

  const subtotal = rows.reduce((sum, row) => sum + row.item.quantity * row.product.price_cents, 0);

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rows.length === 0) {
      setError("Cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/shop/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          items: rows.map((row) => ({
            productId: row.product.id,
            quantity: row.item.quantity,
          })),
          locale: "fr",
        }),
      });

      const payload = (await res.json()) as CheckoutResponse;
      if (!payload.ok) {
        setError(payload.message);
        return;
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setError("Unable to start checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">Cart</h1>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#eadfce] bg-white p-6">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-[#8e5e01] px-5 py-2 text-white">
            Go to shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3 rounded-3xl border border-[#eadfce] bg-white p-6">
            {rows.map(({ item, product }) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl border border-zinc-200 p-3">
                <div>
                  <p className="font-semibold text-[#6e4800]">{product.name_fr}</p>
                  <p className="text-sm text-zinc-500">{formatCurrency(product.price_cents)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(product.id, Number(event.target.value))}
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleCheckout} className="space-y-4 rounded-3xl border border-[#eadfce] bg-white p-6">
            <h2 className="font-display text-2xl text-[#6e4800]">Checkout</h2>
            <p className="text-sm text-zinc-600">Subtotal: {formatCurrency(subtotal)}</p>

            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2"
            />

            <p className="rounded-lg bg-[#f7f3ee] px-3 py-2 text-xs text-zinc-600">
              Local pickup: we will contact you after payment to arrange pickup details.
            </p>

            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#8e5e01] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Loading..." : "Proceed to Stripe"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
