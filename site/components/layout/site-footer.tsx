import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-[#f7f3ee]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 text-sm text-zinc-700 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-serif text-xl font-semibold text-[#6e4800]">Mocha Tans</p>
          <p className="mt-2">1200 Rue Gauthier, Longueuil, QC J4T 3N7</p>
          <p>mochatansmtl@gmail.com</p>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link href="/booking">Booking</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Policies</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link href="/policies">Privacy & Terms</Link>
            <Link href="/policies#cancellation">Cancellation / Refund</Link>
          </div>
          <p className="mt-4 text-xs text-zinc-500">© 2026 Mocha Tans. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
