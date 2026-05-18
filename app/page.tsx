import { CinematicHero } from "@/components/cinematic-hero";
import KanbanBoard from "@/components/kanban/kanban-board";
import { AnimatedTitle } from "@/components/animated-title";
import { Stocks } from "@/components/dashboard/widgets/stocks";

export default async function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <CinematicHero />

      <section className="relative z-10 -mt-20 pb-20 px-6 container mx-auto">
        <div className="flex flex-col gap-8">
          <Stocks/>
          <header className="flex flex-col gap-2">
            <AnimatedTitle
              text="Operations Center"
              className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic"
            />
            <div className="h-1 w-20 bg-accent rounded-full" />
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] max-w-xl">
              Real-time strategic oversight and objective tracking.
            </p>
          </header>

          <div className="rounded-[2.5rem] bg-background/40 backdrop-blur-3xl border border-default-100/50 p-6 lg:p-10 shadow-2xl shadow-black/50 overflow-hidden">
            <KanbanBoard />
          </div>
        </div>
      </section>
    </main>
  );
}
