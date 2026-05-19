import fs from "node:fs/promises";
import path from "node:path";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getLocalMediaPaths() {
  const dir = path.join(process.cwd(), "public", "images");
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => `/images/${entry.name}`)
    .sort();
}

export default async function AdminMediaPage() {
  const images = await getLocalMediaPaths();

  return (
    <section className="space-y-4">
      <h2 className="font-display text-3xl text-[#6e4800]">Media Manager</h2>
      <p className="text-sm text-zinc-600">
        Source assets are stored in <code>/site/public/images</code>. Use these paths in services, products, and homepage sections.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {images.map((src) => (
          <article key={src} className="rounded-2xl border border-[#eadfce] bg-white p-3">
            <Image src={src} alt={src} width={800} height={800} className="h-52 w-full rounded-xl object-cover" />
            <p className="mt-2 break-all text-xs text-zinc-600">{src}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
