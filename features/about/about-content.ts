export const aboutCaptions = {
  manifesto: "Not a resume.",
  person: "My defaults.",
  dock: "One stack.",
  refuse: "No thank you.",
  solitude: "Quiet is a tool.",
  play: "I play anyway.",
  music: "This library only.",
  coke: "The honest can.",
  craft: "Less pile. More spine.",
  product: "A landscape, not drawers.",
  timeline: "Taste trail.",
  outro: "Still becoming.",
} as const;

export const aboutMarkers = ["INTP", "Capricorn", "Apple"] as const;

export const tasteBeads = [
  { id: "early", label: "Early" },
  { id: "habit", label: "Habit" },
  { id: "play", label: "Play" },
  { id: "wire", label: "Wire" },
  { id: "build", label: "Build" },
  { id: "now", label: "Now" },
] as const;

export const playTitles = [
  { id: "zelda", label: "Zelda" },
  { id: "elden", label: "Elden Ring" },
  { id: "mario", label: "Mario" },
  { id: "lol", label: "League" },
  { id: "hok", label: "Honor of Kings" },
] as const;

export const aboutPerson = {
  name: "Lee",
  handle: "LeeWio",
  role: "Engineer · Maker · Observer",
} as const;

/** Longer descriptions for assistive tech — not shown on screen */
export const aboutAria = {
  manifesto: "About page opens with the line: not a resume. This is a personality reel.",
  dock: "Apple devices magnetically snap into one aligned stack.",
  refuse: "Stylized Android and Windows marks are thrown into a trash can.",
  solitude: "Chat noise fades and a door closes. Quiet is treated as a tool.",
  play: "Game badges appear for Zelda, Elden Ring, Mario, League, and Honor of Kings.",
  music: "Other music services slide away. Only Apple Music remains.",
  coke: "A Coke can tips in. A Pepsi mark is swept aside.",
  craft: "Messy feature chips collapse into a single clean spine.",
  product: "File drawers rearrange into a connected landscape.",
  timeline: "Taste timeline beads labeled Early, Habit, Play, Wire, Build, and Now.",
  outro: "The reel ends on the line: still becoming. No links.",
} as const;
