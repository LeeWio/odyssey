import { BlogFeed } from "@/features/blog";
import Grainient from "@/components/background/grainient";
import { Card } from "@heroui/react";

const IN_PROGRESS_CARDS = [
  {
    title: "Aurora Fields",
    description: "A soft cyan current moving through electric blue.",
    color1: "#6ef5ef",
    color2: "#3f71ed",
    color3: "#172b92",
    blendAngle: -18,
    warpFrequency: 4.1,
    warpSpeed: 1.15,
    warpStrength: 1.2,
    rotationAmount: 280,
    zoom: 0.82,
  },
  {
    title: "Violet Bloom",
    description: "Lavender light folding into a deep violet edge.",
    color1: "#f1a3de",
    color2: "#7848ed",
    color3: "#22136d",
    blendAngle: 34,
    warpFrequency: 5.8,
    warpSpeed: 1.55,
    warpStrength: 0.92,
    rotationAmount: 460,
    zoom: 0.72,
  },
  {
    title: "Blue Hour",
    description: "A slow cobalt gradient with a bright magenta seam.",
    color1: "#e77df3",
    color2: "#3c48df",
    color3: "#17105e",
    blendAngle: 122,
    warpFrequency: 3.6,
    warpSpeed: 0.85,
    warpStrength: 1.45,
    rotationAmount: 620,
    zoom: 0.9,
  },
  {
    title: "Emerald Current",
    description: "A cool green stream crossing a clear blue field.",
    color1: "#a8f58e",
    color2: "#20c9c8",
    color3: "#07509e",
    blendAngle: -62,
    warpFrequency: 6.4,
    warpSpeed: 1.8,
    warpStrength: 0.78,
    rotationAmount: 360,
    zoom: 0.66,
  },
] as const;

function InProgressCard({
  title,
  description,
  ...grainientProps
}: (typeof IN_PROGRESS_CARDS)[number]) {
  return (
    <Card className="group relative isolate min-h-95 overflow-hidden border-none">
      <Grainient
        {...grainientProps}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        contrast={1.12}
        grainAmount={0}
        saturation={1.08}
        timeSpeed={0.16}
      />

      <Card.Header className="relative z-10 mt-auto gap-2">
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>

      <Card.Footer className="relative z-10">In Progress</Card.Footer>
    </Card>
  );
}

export default function SingleIndexPage() {
  return (
    <>
      <BlogFeed />

      <section className="bg-background w-full px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-foreground/55 mb-2 text-xs font-medium tracking-[0.18em] uppercase">
                Experiments
              </p>
              <h2 className="text-foreground text-3xl font-semibold tracking-tight">In Progress</h2>
            </div>
            <span className="text-foreground/45 hidden text-sm sm:block">04 active studies</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {IN_PROGRESS_CARDS.map((card) => (
              <InProgressCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
