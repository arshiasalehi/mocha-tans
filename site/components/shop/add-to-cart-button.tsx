"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";

export function AddToCartButton({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        addItem(productId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
      className="rounded-full bg-[#8e5e01] px-6 py-3 font-semibold text-white"
    >
      {added ? "Added" : "Add to cart"}
    </button>
  );
}
