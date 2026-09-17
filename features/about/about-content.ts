export const aboutHero = {
  eyebrow: "Still Becoming",
  titleLead: "A journey,",
  titleAccent: "not a destination.",
  subtitle:
    "Capricorn climb. INTP architecture. Apple stack. Odyssey is the notebook where those three stop pretending to be soft.",
  focusLine: "Now: systems craft · design systems · analog patience",
  focusTags: [
    { id: "capricorn", label: "Capricorn" },
    { id: "intp", label: "INTP" },
    { id: "apple", label: "Apple stack" },
    { id: "systems", label: "Systems" },
    { id: "analog", label: "Analog" },
  ],
} as const;

export const aboutSignals = [
  {
    title: "Surfaces",
    value: 24,
    suffix: "live",
    detail: "Public modules under one identity.",
  },
  {
    title: "Focus",
    value: 4,
    suffix: "threads",
    detail: "Active practice lanes right now.",
  },
  {
    title: "Depth",
    value: 12,
    suffix: "yrs",
    detail: "Systems + interface craft overlapping.",
  },
  {
    title: "Tempo",
    value: 1,
    suffix: "pace",
    detail: "Long-form over posting pressure.",
  },
] as const;

export const aboutValueMeters = [
  { label: "Content first", value: 96, color: "accent" as const },
  { label: "Accessible by default", value: 92, color: "success" as const },
  { label: "Motion explains", value: 88, color: "accent" as const },
  { label: "Built to evolve", value: 90, color: "warning" as const },
] as const;

export const aboutReadingGuide = [
  {
    id: "first-visit",
    title: "First visit",
    body: "Start with one essay or Constellations. Do not try to finish the whole product in one pass.",
  },
  {
    id: "return",
    title: "Coming back",
    body: "Roadmap and Schedule show what is moving. Chronicle keeps the durable writing.",
  },
  {
    id: "hiring",
    title: "Hiring or collaboration",
    body: "Use the Recruiter surface for fit, then leave a note in the guestbook if you want a human reply.",
  },
] as const;

export const aboutAxes = {
  title: "Two fixed points",
  lead: "I do not treat personality labels as decoration. Capricorn and INTP are the shortest accurate description of how I build, wait, and refuse.",
  poles: [
    {
      id: "capricorn",
      label: "Capricorn",
      tag: "Earth · Cardinal",
      chipColor: "default" as const,
      body: "I climb slowly and I keep the map. Mood is weather. Structure is climate. If a project needs applause every week, I am the wrong person.",
      lines: [
        "Long horizon over loud launches.",
        "Patience is a tool, not a personality pose.",
        "Finish the hard part before you brand it.",
      ],
    },
    {
      id: "intp",
      label: "INTP",
      tag: "Architect mind",
      chipColor: "accent" as const,
      body: "I build models first. Conversation is useful when it sharpens the model. Small talk is latency. Precision is kindness.",
      lines: [
        "Systems before slogans.",
        "Sparse social, dense thinking.",
        "If it cannot be reasoned, it will not be shipped.",
      ],
    },
  ],
  collision: {
    title: "Where they collide",
    body: "Capricorn keeps the climb honest. INTP keeps the architecture clean. Odyssey is what happens when both refuse to settle for a pretty blog that cannot think.",
  },
} as const;

export const aboutPlatformCreed = {
  title: "Platform creed",
  punch: "One stack. No debate.",
  body: "I am a loyal Apple user. Not as fashion. As infrastructure. Continuity, silicon, and a single design language beat a frankenstein of vendors every day of the week.",
  refuseTitle: "Android and Windows",
  refuseBody:
    "I cannot stand them for daily work. Android feels like a committee. Windows feels like a museum of decisions nobody wanted. I will not pretend otherwise to sound open-minded.",
  keep: [
    {
      kind: "apple" as const,
      label: "macOS + Apple Silicon",
      detail: "The machine should disappear. Mine does.",
    },
    {
      kind: "apple" as const,
      label: "iPhone",
      detail: "One pocket computer. No second OS to babysit.",
    },
    {
      kind: "display" as const,
      label: "Continuity",
      detail: "Clipboard, Handoff, AirDrop. Boring. Correct.",
    },
  ],
  refuse: [
    {
      label: "Android",
      detail: "Infinite skins. Zero spine.",
    },
    {
      label: "Windows",
      detail: "Settings menus that argue with themselves.",
    },
    {
      label: "Cross-platform by default",
      detail: "Usually means nobody loved the product.",
    },
  ],
  footnote:
    "This is taste with teeth. If that offends your stack religion, we already know we will fight about fonts later.",
} as const;

export const aboutPerson = {
  name: "Lee",
  handle: "LeeWio",
  role: "Engineer · Maker · Observer",
  badge: "Owner",
  markers: ["Capricorn", "INTP", "Apple"],
  bio: [
    "Capricorn by sign, INTP by wiring. I work where front-end product engineering meets low-level systems: notice the constraint, cut the noise, leave the interaction feeling inevitable.",
    "Away from the keyboard I shoot medium-format film and listen to modular sound. Same temperament: fewer decisions, stronger frames, no appetite for disposable noise.",
    "This site is not a resume dump. It is the public shape of a slow climb: writing, tools, images, and the links between them.",
  ],
  interests: [
    {
      label: "Embedded & RTOS",
      detail: "Scheduling, latency budgets, and careful driver-level work.",
      href: "/recruiter",
    },
    {
      label: "Design systems",
      detail: "Tokens, accessible layout, and motion that explains state.",
      href: "/uses",
    },
    {
      label: "Film photography",
      detail: "Medium format frames that reward slower looking.",
      href: "/gallery",
    },
    {
      label: "Modular audio",
      detail: "Sound as structure, not background filler.",
      href: "/explore",
    },
  ],
  now: [
    { label: "Shipping Odyssey surfaces", href: "/roadmap" },
    { label: "Deep-focus schedule", href: "/schedule" },
    { label: "Analog field notes", href: "/gallery" },
  ],
  values: [
    {
      label: "Content first",
      detail: "If a visual choice hurts reading, it loses.",
    },
    {
      label: "Accessible by default",
      detail: "Keyboard, screen reader, and every viewport count.",
    },
    {
      label: "Motion explains",
      detail: "Animation confirms change. It never performs for its own sake.",
    },
    {
      label: "Built to evolve",
      detail: "Modules can grow without fracturing the identity.",
    },
  ],
  elsewhere: [
    { label: "GitHub", href: "https://github.com/LeeWio", external: true },
    { label: "Email", href: "mailto:just.vireo@gmail.com", external: true },
    { label: "RSS", href: "/rss.xml", external: false },
  ],
} as const;

export const aboutWhy = {
  title: "Why Odyssey exists",
  lead: "Most blogs expose a database. Odyssey tries to expose a landscape.",
  paragraphs: [
    "Categories, tags, and chronological lists are storage metaphors. Useful, but flat. I wanted a place where essays, tools, photographs, and focus records could pull on each other instead of sitting in separate drawers.",
    "That means one identity with multiple expressions: Chronicle for long reading, Constellations for spatial browsing, Uses for the desk, Gallery for looking, and quieter surfaces for planning and return visits.",
  ],
  antiGoals: {
    title: "What this is not",
    description:
      "Not a posting treadmill, not a recommendation feed, and not a template portfolio that exists only to convert visitors.",
  },
  belongings: [
    {
      label: "Writing",
      description: "Essays, notes, and columns that should still matter next year.",
      href: "/chronicle",
    },
    {
      label: "Practice",
      description: "Hardware, software, and rituals that keep the work possible.",
      href: "/uses",
    },
    {
      label: "Observation",
      description: "Photographs, music, and places worth revisiting.",
      href: "/gallery",
    },
  ],
} as const;

export const aboutTimeline = [
  {
    time: "Origin",
    title: "A blog that felt like storage",
    description:
      "Started from the usual stack of posts and tags, then hit the limits of that metaphor.",
    status: "success" as const,
    tag: "Past",
    tagColor: "default" as const,
  },
  {
    time: "Shift",
    title: "Treat knowledge as a landscape",
    description:
      "Rewrote the product around connected reading, personal systems, and shared design language.",
    status: "success" as const,
    tag: "Shipped",
    tagColor: "success" as const,
  },
  {
    time: "Now",
    title: "One identity, many surfaces",
    description:
      "Writing, constellation maps, tools, gallery, and focus systems living under one roof.",
    status: "current" as const,
    tag: "Active",
    tagColor: "accent" as const,
  },
  {
    time: "Next",
    title: "Deeper capture and return paths",
    description:
      "Richer profile memory, clearer discovery, and quieter ways to come back to unfinished threads.",
    status: "muted" as const,
    tag: "Ahead",
    tagColor: "default" as const,
  },
] as const;

export const aboutPrinciples = [
  {
    title: "Content first",
    description:
      "Typography, spacing, and contrast exist to make the writing easier to stay with. Decoration that compete with reading get cut.",
    href: "/explore",
    linkLabel: "Browse essays",
  },
  {
    title: "Motion explains",
    description:
      "Entrance, state change, and spatial continuity are fair uses of motion. Spectacle that delays comprehension is not.",
    href: "/tour",
    linkLabel: "Take the tour",
  },
  {
    title: "Systems craft",
    description:
      "Latency, structure, and edge cases matter as much as polish. Low-level habits show up in ordinary interactions.",
    href: "/recruiter",
    linkLabel: "See the work",
  },
  {
    title: "Analog patience",
    description:
      "Film and sound reward slower attention. Odyssey borrows that tempo: fewer frames, stronger composition.",
    href: "/gallery",
    linkLabel: "Open the gallery",
  },
] as const;

export const aboutPaths = {
  title: "Choose an orbit",
  description:
    "Start from intent. Odyssey does not need a full walkthrough to be useful on the first visit.",
  steps: [
    {
      title: "Read",
      description: "Long-form essays and columns",
      href: "/explore",
      cta: "Browse essays",
    },
    {
      title: "Wander",
      description: "Spatial map of topics and stars",
      href: "/constellations",
      cta: "Open constellations",
    },
    {
      title: "Inspect",
      description: "Desk, tools, and working setup",
      href: "/uses",
      cta: "See the desk",
    },
    {
      title: "Connect",
      description: "Hiring context or a short note",
      href: "/recruiter",
      cta: "Work with me",
    },
  ],
  secondary: [
    { label: "Guestbook", href: "/guestbook" },
    { label: "Copilot", href: "/copilot" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Tour", href: "/tour" },
  ],
} as const;
