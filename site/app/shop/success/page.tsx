import Link from "next/link";

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">Order confirmed</h1>
      <p className="mt-4 text-zinc-700">Payment completed. We will contact you to arrange pickup.</p>
      {params.session_id ? <p className="mt-2 text-sm text-zinc-500">Session: {params.session_id}</p> : null}
      <div className="mt-6 flex gap-3">
        <Link href="/account" className="rounded-full bg-[#8e5e01] px-5 py-2 text-white">
          View account
        </Link>
        <Link href="/shop" className="rounded-full border border-zinc-300 px-5 py-2">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}
