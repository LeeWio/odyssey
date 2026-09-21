import { Navbar } from "@/components/navbar";
import { GlobalControl } from "@/components/global-control";
import { Footer } from "@/components/footer";
import { MiniPlayerGate } from "@/features/media/components/mini-player-gate";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="bg-background text-foreground focus-visible:ring-accent sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-[100] focus-visible:rounded-lg focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <Navbar />
      <GlobalControl />
      <main id="main-content" tabIndex={-1} className="flex w-full grow flex-col outline-none">
        {children}
      </main>
      <Footer />
      <MiniPlayerGate />
    </div>
  );
}
