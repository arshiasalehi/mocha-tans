import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">Payment cancelled</h1>
      <p className="mt-4 text-zinc-700">No charge was made. You can return and try again when ready.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/booking" className="rounded-full bg-[#8e5e01] px-5 py-2 text-white">
          Back to booking
        </Link>
        <Link href="/cart" className="rounded-full border border-zinc-300 px-5 py-2">
          Back to cart
        </Link>
      </div>
    </section>
  );
}
