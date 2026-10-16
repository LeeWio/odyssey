import { notFound } from "next/navigation";

import { ShaderBackgroundPreview } from "@/components/shader-background/shader-background-preview";

export default function ShaderBackgroundTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="flex min-h-[100dvh] w-full items-center px-6 py-16">
      <ShaderBackgroundPreview />
    </main>
  );
}
