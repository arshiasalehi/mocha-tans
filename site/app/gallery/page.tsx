import Image from "next/image";

const images = [
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-4.jpg",
  "/images/instagram_DYZagBHDjZ1__main_image__1.jpg",
  "/images/instagram_DX60QplDuar__carousel_1_image__13.jpg",
];

export default function GalleryPage() {
  return (
    <section className="container-page py-16">
      <h1 className="font-display text-4xl text-[#6e4800]">Gallery</h1>
      <div className="mt-8 columns-1 gap-4 space-y-4 md:columns-3">
        {images.map((src) => (
          <div key={src} className="overflow-hidden rounded-2xl border border-[#eadfce] bg-white">
            <Image src={src} alt={src} width={900} height={1200} className="h-auto w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
