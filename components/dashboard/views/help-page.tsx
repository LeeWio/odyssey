"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import { ArrowRightFromSquare, Book, Comment, LifeRing } from "@gravity-ui/icons";
import { Accordion, Button, Card, Link, SearchField } from "@heroui/react";

type HelpLink = {
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
};

const HELP_LINKS: readonly HelpLink[] = [
  {
    description: "Browse the public writing space and see how content is organized.",
    href: "/single",
    icon: Book,
    title: "Read the publication",
  },
  {
    description: "Review the columns that shape the site's main reading paths.",
    href: "/columns",
    icon: Comment,
    title: "Browse columns",
  },
  {
    description: "Leave a note, report a problem, or suggest an improvement.",
    href: "/guestbook",
    icon: LifeRing,
    title: "Leave feedback",
  },
];

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: readonly FaqItem[] = [
  {
    answer:
      "Open Settings > Billing and click 'Change plan'. Changes take effect at the start of your next billing cycle.",
    question: "How do I upgrade my plan?",
  },
  {
    answer:
      "Yes. In Settings > Security turn on Two-factor authentication and follow the on-screen prompts.",
    question: "Can I enable two-factor authentication?",
  },
  {
    answer:
      "Head to Settings > General and click 'Delete account'. This action is irreversible and purges all your data after 30 days.",
    question: "How do I delete my account?",
  },
  {
    answer:
      "You can invite new members from Settings > Team. They'll receive an email invite with instructions to join.",
    question: "How do I invite teammates?",
  },
];

export function HelpPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredFaqs = useMemo(
    () =>
      FAQS.filter(({ answer, question }) =>
        `${question} ${answer}`.toLowerCase().includes(normalizedQuery)
      ),
    [normalizedQuery]
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pt-8 pb-10">
      <header className="flex flex-col gap-1">
        <p className="text-muted text-sm font-medium">Dashboard support</p>
        <h1 className="text-foreground text-2xl font-semibold">Help &amp; information</h1>
        <p className="text-muted max-w-2xl text-sm">
          Find a useful destination or search the answers below before opening another task.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Help destinations">
        {HELP_LINKS.map((link) => (
          <HelpLinkCard key={link.title} link={link} />
        ))}
      </div>

      <section aria-labelledby="faq-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 id="faq-heading" className="text-foreground text-base font-semibold">
              Frequently asked questions
            </h2>
            <p className="text-muted text-sm">
              {filteredFaqs.length} of {FAQS.length} answers
            </p>
          </div>
          <SearchField
            aria-label="Search frequently asked questions"
            className="w-full sm:w-72"
            name="help-search"
            value={query}
            onChange={setQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search help..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        {filteredFaqs.length > 0 ? (
          <Accordion className="w-full">
            {filteredFaqs.map((faq, index) => (
              <Accordion.Item key={faq.question} id={`faq-${index}`}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    {faq.question}
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="text-muted text-sm">{faq.answer}</Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : (
          <Card className="rounded-lg">
            <Card.Header>
              <Card.Title className="text-base">No answers found</Card.Title>
              <Card.Description>Try a shorter search or clear the current query.</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button size="sm" variant="secondary" onPress={() => setQuery("")}>
                Clear search
              </Button>
            </Card.Footer>
          </Card>
        )}
      </section>

      <p className="text-muted text-xs">
        Need to report an issue? Use the feedback page so the request stays connected to the site.
      </p>
    </div>
  );
}

function HelpLinkCard({ link }: { link: HelpLink }) {
  const Icon = link.icon;

  return (
    <Card className="rounded-lg">
      <Card.Header>
        <div className="bg-accent-soft text-accent flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </div>
        <Card.Title className="text-base">{link.title}</Card.Title>
        <Card.Description>{link.description}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Link className="text-accent inline-flex items-center gap-1 text-sm" href={link.href}>
          Open destination
          <ArrowRightFromSquare className="size-3.5" />
        </Link>
      </Card.Footer>
    </Card>
  );
}
