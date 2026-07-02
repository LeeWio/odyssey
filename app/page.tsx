"use client";

import { useRef } from "react";
import { Carousel, HoverCard } from "@heroui-pro/react";
import {
  Button,
  Card,
  Typography,
  Chip,
  Accordion,
  Avatar,
  Input,
  Separator,
  Surface,
} from "@heroui/react";
import { ChronicleDeck, OrbitalCarousel, StockLedger } from "@/components/blog";

import ChevronRight from "@gravity-ui/icons/ChevronRight";
import Globe from "@gravity-ui/icons/Globe";
import Palette from "@gravity-ui/icons/Palette";
import ShieldCheck from "@gravity-ui/icons/ShieldCheck";
import Persons from "@gravity-ui/icons/Persons";
import Check from "@gravity-ui/icons/Check";
import ChevronDown from "@gravity-ui/icons/ChevronDown";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const CRAZY_ONES = [
  {
    name: "Steve Jobs",
    title: "Co-founder, Apple Inc.",
    image: "https://i.pravatar.cc/150?u=steve",
    quote:
      "The people who are crazy enough to think they can change the world are the ones who do.",
  },
  {
    name: "Alan Turing",
    title: "Father of Computer Science",
    image: "https://i.pravatar.cc/150?u=alan",
    quote:
      "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
  },
  {
    name: "Albert Einstein",
    title: "Theoretical Physicist",
    image: "https://i.pravatar.cc/150?u=albert",
    quote:
      "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.",
  },
  {
    name: "Ada Lovelace",
    title: "First Computer Programmer",
    image: "https://i.pravatar.cc/150?u=ada",
    quote: "That brain of mine is something more than merely mortal; as time will show.",
  },
];

function ThinkDifferentSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".person-card");

      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top top+=160",
          endTrigger: ".cards-end-marker",
          end: "bottom bottom",
          pin: true,
          pinSpacing: false,
        });

        if (i !== cards.length - 1) {
          gsap.to(card, {
            scale: 0.9,
            opacity: 0.5,
            y: -10,
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: "top top+=160",
              scrub: true,
            },
          });
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <Surface
      ref={containerRef}
      variant="transparent"
      className="relative flex w-full flex-col items-center px-6 py-24 lg:py-32"
    >
      <div className="mb-24 flex max-w-3xl flex-col gap-4 text-center">
        <Typography type="h1" align="center" color="default" weight="semibold">
          Think Different
        </Typography>

        <Typography
          type="h5"
          align="center"
          color="muted"
          weight="normal"
          className="leading-relaxed italic"
        >
          &quot;Here&apos;s to the crazy ones. The misfits. The rebels. The troublemakers... Because
          the people who are crazy enough to think they can change the world, are the ones who
          do.&quot;
        </Typography>
      </div>

      <div className="relative flex w-full max-w-2xl flex-col items-center gap-[50vh] pb-[30vh]">
        {CRAZY_ONES.map((person, i) => (
          <div key={i} className="person-card w-full origin-top">
            <HoverCard>
              <HoverCard.Trigger className="block w-full cursor-pointer outline-none">
                <Card className="bg-surface border-border hover:bg-surface-secondary flex w-full flex-col items-center gap-8 border p-8 shadow-2xl transition-colors sm:flex-row sm:p-12">
                  <Avatar size="lg" className="ring-primary/10 h-28 w-28 shrink-0 text-3xl ring-4">
                    <Avatar.Image src={person.image} alt={person.name} />
                    <Avatar.Fallback>{person.name.charAt(0)}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col gap-3 text-center sm:text-left">
                    <Typography type="h3" className="text-2xl font-bold">
                      {person.name}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                      {person.title}
                    </Typography>
                  </div>
                </Card>
              </HoverCard.Trigger>
              <HoverCard.Content className="max-w-md p-6" placement="top">
                <Typography className="font-serif text-lg leading-relaxed italic">
                  &quot;{person.quote}&quot;
                </Typography>
              </HoverCard.Content>
            </HoverCard>
          </div>
        ))}
        <div className="cards-end-marker h-px w-full" />
      </div>
    </Surface>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col">
      <Surface
        variant="transparent"
        className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-24 text-center lg:px-10 lg:py-32"
      >
        <Chip>HeroUI v3.0 Released</Chip>

        <Typography
          type="h1"
          className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
        >
          Ship Faster, Build Better
        </Typography>

        <Typography className="text-muted mt-6 max-w-2xl text-lg sm:text-xl">
          Everything you need to launch a beautiful, accessible, and highly performant website
          without reinventing the wheel.
        </Typography>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button>
            Get Started <ChevronRight className="ml-2 size-4" />
          </Button>
          <Button variant="outline" className="font-medium">
            Read Documentation
          </Button>
        </div>
      </Surface>

      {/* 3D 星轨环形文章展示区 */}
      <OrbitalCarousel />

      {/* 时光卡牌堆叠折叠文章展示区 */}
      <ChronicleDeck />

      {/* 股票买入/卖出量化交易日志区 */}
      <StockLedger />

      <Surface variant="transparent" className="px-6 py-24 text-center lg:px-10 lg:py-32">
        <Typography className="text-muted mb-8 text-sm font-semibold tracking-wider uppercase">
          Trusted by innovative teams worldwide
        </Typography>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-60 grayscale filter transition-all hover:grayscale-0">
          <Typography type="h4" className="text-xl font-bold tracking-tighter">
            ACME Corp
          </Typography>
          <Typography type="h4" className="text-xl font-bold tracking-widest italic">
            GLOBAL
          </Typography>
          <Typography type="h4" className="text-xl font-bold uppercase">
            Nexus
          </Typography>
          <Typography type="h4" className="font-serif text-xl font-bold">
            Aero
          </Typography>
          <Typography type="h4" className="text-xl font-bold tracking-tight">
            Quantum
          </Typography>
        </div>
      </Surface>

      <Surface variant="transparent" className="flex flex-col gap-6 px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col gap-2">
          <Typography type="h1" align="start" color="default" weight="semibold" truncate>
            Powerful Features
          </Typography>

          <Typography type="h5" align="start" color="muted" weight="normal" truncate>
            Built with developers in mind to provide the best experience possible.
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Globe className="size-6" aria-hidden="true" />,
              title: "Global CDN",
              desc: "Deploy seamlessly worldwide.",
            },
            {
              icon: <Palette className="size-6" aria-hidden="true" />,
              title: "Themeable",
              desc: "Easily switch themes and styles.",
            },
            {
              icon: <ShieldCheck className="size-6" aria-hidden="true" />,
              title: "Secure",
              desc: "Enterprise-grade security built-in.",
            },
            {
              icon: <Persons className="size-6" aria-hidden="true" />,
              title: "Collaboration",
              desc: "Work together in real-time.",
            },
            {
              icon: <Check className="size-6" aria-hidden="true" />,
              title: "Accessible",
              desc: "Fully accessible out of the box.",
            },
            {
              icon: <Globe className="size-6" aria-hidden="true" />,
              title: "SEO Ready",
              desc: "Optimized for search engines.",
            },
          ].map((feature, idx) => (
            <Card key={idx}>
              {feature.icon}
              <Card.Header>
                <Card.Title className="mb-2 text-xl font-semibold">{feature.title}</Card.Title>
                <Card.Description className="text-muted leading-relaxed">
                  {feature.desc}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Surface>

      <Surface variant="transparent" className="flex flex-col gap-6 px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-end lg:px-10">
          <div className="">
            <Typography type="h2" className="text-3xl font-bold tracking-tight">
              Tools of the Trade
            </Typography>
            <Typography className="text-muted mt-4 text-lg">
              To do exceptional work, first forge exceptional tools.
            </Typography>
          </div>
          <Button variant="ghost" size="md" className="shrink-0 font-medium">
            View Full Setup <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>

        <Carousel opts={{ align: "start", loop: true }}>
          <Carousel.Content>
            {[
              {
                name: 'MacBook Pro 16"',
                category: "Hardware",
                desc: "M3 Max with 64GB unified memory. Absolute powerhouse for development and design.",
                tags: ["Apple", "M3 Max"],
              },
              {
                name: "Cursor",
                category: "Software",
                desc: "The AI-first code editor. Radically speeds up my workflow with built-in copilot features.",
                tags: ["Editor", "AI"],
              },
              {
                name: "Keychron Q1 Pro",
                category: "Accessories",
                desc: "Custom mechanical keyboard with tactile switches. Typing on this every day is a joy.",
                tags: ["Keyboard", "Custom"],
              },
              {
                name: "Figma",
                category: "Software",
                desc: "Where all the design magic happens. I spend almost as much time here as in the terminal.",
                tags: ["Design", "Prototyping"],
              },
              {
                name: "Sony A7 IV",
                category: "Photography",
                desc: "My go-to camera for taking high-quality photos for the blog and capturing memories.",
                tags: ["Camera", "Mirrorless"],
              },
              {
                name: "Herman Miller Embody",
                category: "Furniture",
                desc: "The ultimate ergonomic chair. Keeping my back happy during those long coding sessions.",
                tags: ["Ergonomics", "Chair"],
              },
            ].map((item, i) => (
              <Carousel.Item
                key={i}
                className="basis-11/12 pl-6 sm:basis-2/3 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <Card className="flex h-full flex-col overflow-hidden">
                  <Card.Header className="text-muted font-medium">{item.category}</Card.Header>
                  <Card.Content>
                    <Typography className="text-primary mb-1 text-sm font-semibold tracking-wider uppercase">
                      {item.category}
                    </Typography>
                    <Typography type="h4" className="text-xl font-semibold">
                      {item.name}
                    </Typography>
                    <Typography className="text-muted mt-2 flex-1">{item.desc}</Typography>
                  </Card.Content>
                  <Card.Footer className="flex flex-wrap items-center gap-2">
                    {item.tags.map((tag) => (
                      <Chip key={tag} size="sm">
                        {tag}
                      </Chip>
                    ))}
                  </Card.Footer>
                </Card>
              </Carousel.Item>
            ))}
          </Carousel.Content>
          <div className="flex justify-center gap-3">
            <Carousel.Previous className="relative inset-0 translate-y-0" />
            <Carousel.Next className="relative inset-0 translate-y-0" />
          </div>
        </Carousel>
      </Surface>

      <Surface variant="transparent" className="flex flex-col gap-6 px-6 py-24 lg:px-10 lg:py-32">
        <Typography type="h1" align="start" color="default" weight="semibold" truncate>
          What People Are Saying
        </Typography>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Alice Johnson",
              role: "Frontend Lead",
              text: "This library has completely transformed how we build UIs. It's incredibly fast and easy to use.",
              initials: "AJ",
              color: "success" as const,
            },
            {
              name: "Mark Smith",
              role: "Product Manager",
              text: "We shipped our MVP two weeks early thanks to the pre-built layouts and components.",
              initials: "MS",
              color: "accent" as const,
            },
            {
              name: "Sarah Lee",
              role: "Designer",
              text: "The attention to detail and out-of-the-box design system fits perfectly with our brand guidelines.",
              initials: "SL",
              color: "danger" as const,
            },
          ].map((testimonial, i) => (
            <Card key={i} className="flex flex-col justify-between">
              <Card.Content>
                <Typography
                  type="h4"
                  align="start"
                  color="muted"
                  weight="normal"
                  className=""
                  truncate={false}
                >
                  &quot;{testimonial.text}&quot;
                </Typography>
              </Card.Content>

              <Card.Footer className="flex flex-row gap-2">
                <Avatar color={testimonial.color} size="md">
                  <Avatar.Fallback>{testimonial.initials}</Avatar.Fallback>
                </Avatar>

                <div className="flex flex-col">
                  <Typography type="body-sm" align="start" color="default" weight="normal" truncate>
                    {testimonial.name}
                  </Typography>
                  <Typography type="body-xs" align="start" color="muted" weight="normal" truncate>
                    {testimonial.role}
                  </Typography>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Surface>

      <Surface variant="transparent" className="flex flex-col gap-6 px-6 py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col gap-2">
          <Typography type="h1" align="start" color="default" weight="semibold" truncate>
            Simple, transparent pricing
          </Typography>

          <Typography type="h5" align="start" color="muted" weight="normal" truncate>
            No hidden fees. No surprise charges.
          </Typography>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-8 md:grid-cols-2">
          <Card>
            <Typography type="h3" align="start" color="muted" weight="normal" truncate>
              Hobby
            </Typography>
            <Typography type="h3" align="start" color="muted" weight="normal" truncate>
              Perfect for side projects.
            </Typography>
            <div className="mb-6 flex items-baseline gap-1">
              <Typography className="text-5xl font-extrabold">$0</Typography>
              <Typography className="text-muted">/month</Typography>
            </div>
            <ul className="flex flex-col gap-3">
              {["1 Project", "Basic Components", "Community Support", "1GB Storage"].map(
                (item, i) => (
                  <li key={i} className="text-muted flex items-center gap-2">
                    <Check className="text-success size-4" /> {item}
                  </li>
                )
              )}
            </ul>
            <Button fullWidth variant="outline">
              Get Started
            </Button>
          </Card>

          <Card className="border-primary relative transform border-2 p-8 shadow-lg md:-translate-y-4">
            <div className="absolute top-0 right-0 translate-x-2 -translate-y-3 transform">
              <Chip>Most Popular</Chip>
            </div>
            <Typography type="h3" className="mb-2 text-2xl font-semibold">
              Pro
            </Typography>
            <Typography className="text-muted mb-6">For professional teams.</Typography>
            <div className="mb-6 flex items-baseline gap-1">
              <Typography className="text-5xl font-extrabold">$29</Typography>
              <Typography className="text-muted">/month</Typography>
            </div>
            <ul className="mb-8 flex flex-col gap-3">
              {[
                "Unlimited Projects",
                "All Pro Components",
                "Priority Support",
                "100GB Storage",
                "Custom Domains",
              ].map((item, i) => (
                <li key={i} className="text-foreground flex items-center gap-2">
                  <Check className="text-primary size-4" /> {item}
                </li>
              ))}
            </ul>
            <Button size="md">Subscribe Now</Button>
          </Card>
        </div>
      </Surface>

      <ThinkDifferentSection />

      <Surface
        variant="transparent"
        className="flex flex-col items-center justify-center gap-6 px-6 py-24 lg:px-10 lg:py-32"
      >
        <div className="flex flex-col gap-2">
          <Typography type="h1" align="center" color="default" weight="semibold" truncate>
            Frequently Asked Questions
          </Typography>

          <Typography type="h5" align="center" color="muted" weight="normal" truncate>
            No hidden fees. No surprise charges.
          </Typography>
        </div>

        <Accordion className="max-w-5xl items-center" variant="surface">
          {[
            {
              q: "Is this library free to use?",
              a: "The core components are open source and completely free. We also offer a Pro version for advanced templates and premium components.",
            },
            {
              q: "Do I need to know Tailwind CSS?",
              a: "While it helps, our components are styled beautifully out of the box. You only need Tailwind if you want to heavily customize the defaults.",
            },
            {
              q: "Is it compatible with Next.js?",
              a: "Yes, it is built specifically with React and Next.js in mind, fully supporting React Server Components.",
            },
            {
              q: "Can I use it for commercial projects?",
              a: "Absolutely! You can build and sell projects to clients using our components without any restrictions.",
            },
          ].map((faq, i) => (
            <Accordion.Item key={i}>
              <Accordion.Heading>
                <Accordion.Trigger className="py-4 text-lg font-medium">
                  {faq.q}
                  <Accordion.Indicator>
                    <ChevronDown />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-muted pb-4">{faq.a}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Surface>

      <footer className="border-border bg-background border-t px-6 py-12 lg:px-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 justify-between gap-12 md:grid-cols-2">
          <div className="flex max-w-sm flex-col gap-4">
            <Typography type="h3" className="text-xl font-bold">
              Newsletter
            </Typography>
            <Typography className="text-muted">
              Subscribe to our newsletter to get the latest updates and exclusive content straight
              to your inbox.
            </Typography>
            <div className="mt-2 flex items-center gap-2">
              <Input
                aria-label="Email address"
                placeholder="Enter your email"
                type="email"
                className="max-w-[240px]"
              />
              <Button>Subscribe</Button>
            </div>
          </div>

          <div className="flex justify-start gap-16 md:justify-end">
            <div className="flex flex-col gap-3">
              <Typography className="mb-2 font-semibold">Product</Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                Features
              </Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                Pricing
              </Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                Changelog
              </Typography>
            </div>
            <div className="flex flex-col gap-3">
              <Typography className="mb-2 font-semibold">Company</Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                About Us
              </Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                Careers
              </Typography>
              <Typography className="text-muted hover:text-foreground cursor-pointer text-sm">
                Contact
              </Typography>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-muted mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm sm:flex-row">
          <Typography>© 2026 Odyssey Inc. All rights reserved.</Typography>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
