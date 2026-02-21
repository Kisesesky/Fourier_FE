// app/product/[slug]/_components/ModuleImageGallery.tsx
import Image from "next/image";

type ModuleImageGalleryProps = {
  title: string;
  images: string[];
};

export default function ModuleImageGallery({ title, images }: ModuleImageGalleryProps) {
  return (
    <section className="space-y-4">
      {images.map((src, idx) => (
        <article key={`${src}-${idx}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
            <Image
              src={src}
              alt={`${title} 화면 ${idx + 1}`}
              width={2000}
              height={1200}
              className="h-auto w-full"
              priority={idx === 0}
            />
          </div>
        </article>
      ))}
    </section>
  );
}
