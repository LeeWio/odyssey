import { notFound } from "next/navigation";

export default function BuildingPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[50dvh] w-full max-w-lg flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">Dev only</p>
      <h1 className="text-2xl font-semibold tracking-tight">Building playground</h1>
      <p className="text-muted text-sm leading-relaxed">
        This route is reserved for local experiments. Production builds return 404.
      </p>
    </div>
  );
}
