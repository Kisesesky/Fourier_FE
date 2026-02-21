// app/product/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingShell from "@/components/landing/LandingShell";
import ModuleImageGallery from "./_components/ModuleImageGallery";
import { MODULE_PAGE_MAP } from "./_model/module-page-data";

type ModulePageParams = {
  params: { slug: string };
};

export function generateMetadata({ params }: ModulePageParams): Metadata {
  const data = MODULE_PAGE_MAP[params.slug];
  return {
    title: data ? `Fourier | ${data.title}` : "Fourier | Module",
    description: data?.description ?? "Fourier module page",
  };
}

export default function ModuleDetailPage({ params }: ModulePageParams) {
  const data = MODULE_PAGE_MAP[params.slug];
  if (!data) {
    notFound();
  }

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
        <section className="space-y-2">
          <p className="text-sm text-slate-500">{data.subtitle}</p>
          <h1 className="mt-2 text-4xl font-semibold">{data.title}</h1>
          <p className="mt-4 text-base text-slate-600">{data.description}</p>
        </section>

        <ModuleImageGallery title={data.title} images={data.images} />
      </div>
    </LandingShell>
  );
}
