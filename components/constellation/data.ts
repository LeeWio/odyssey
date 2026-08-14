import * as THREE from "three";
import { UniverseData } from "./types";

export const universeData: UniverseData = {
  id: "odyssey",
  name: "Odyssey Knowledge Universe",
  description: "A spatial mapping of knowledge, interests, and creative outputs.",
  stats: {
    articles: 24,
    topics: 12,
    constellations: 3,
    years: 4,
  },
  constellations: [
    {
      id: "mercury-c",
      name: "CREATIVE & LIFE",
      description: "Soundscapes, analog mediums, and life discoveries.",
      articleCount: 6,
      color: "#aaaaaa",
      position: new THREE.Vector3(-35, 5, -15),
      connections: [{ from: "mercury-s", to: "earth-s" }],
      stars: [
        {
          id: "mercury-s",
          name: "MERCURY",
          description:
            "Creative expressions, hardware modular synthesizers, and medium-format analog photography.",
          weight: 1.0,
          articleCount: 6,
          activity: "medium",
          modelPath: "/models/mercury.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [
            {
              id: "synth",
              name: "Modular Synthesizers",
              starId: "mercury-s",
              articleCount: 3,
              position: new THREE.Vector3(1, 1, 0),
            },
            {
              id: "analog",
              name: "Analog Photography",
              starId: "mercury-s",
              articleCount: 3,
              position: new THREE.Vector3(-1, -1, 0),
            },
          ],
          articles: [
            {
              id: "m1",
              title: "Eurorack & Subtractive Synthesis: A Primer",
              summary:
                "Exploring control voltage, frequency modulation, and the beauty of analog unpredictability.",
              publishedAt: "2026-03-12",
              readingTime: 8,
              topics: ["Audio", "Hardware"],
            },
            {
              id: "m2",
              title: "Medium Format in the Digital Age",
              summary:
                "Why shooting with a Hasselblad 500C in 2026 feels more deliberate than any high-megapixel mirrorless sensor.",
              publishedAt: "2025-11-05",
              readingTime: 6,
              topics: ["Photography", "Medium Format"],
            },
            {
              id: "m3",
              title: "A Study of Ambient Textures",
              summary:
                "Designing deep soundscapes using field recordings, granular synthesis, and tape delays.",
              publishedAt: "2025-08-20",
              readingTime: 12,
              topics: ["Audio", "Ambient"],
            },
          ],
        },
      ],
    },
    {
      id: "earth-c",
      name: "DESIGN & INTERACTION",
      description: "Human-computer interfaces, design systems, and visual engineering.",
      articleCount: 10,
      color: "#00aaff",
      position: new THREE.Vector3(0, -2, 10),
      connections: [
        { from: "earth-s", to: "saturn-s" },
        { from: "earth-s", to: "mercury-s" },
      ],
      stars: [
        {
          id: "earth-s",
          name: "EARTH",
          description:
            "Visual design, fluid UI motion, accessibility, and high-fidelity prototyping systems.",
          weight: 1.2,
          articleCount: 10,
          activity: "high",
          modelPath: "/models/earth.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [
            {
              id: "design-systems",
              name: "Design Systems",
              starId: "earth-s",
              articleCount: 5,
              position: new THREE.Vector3(1, 0, 1),
            },
            {
              id: "interaction",
              name: "Interaction Design",
              starId: "earth-s",
              articleCount: 5,
              position: new THREE.Vector3(-1, 1, -1),
            },
          ],
          articles: [
            {
              id: "e1",
              title: "Fluid Interfaces: The Invisible Mechanics of Motion",
              summary:
                "Applying Disney's 12 principles to web transitions to build interfaces that feel naturally responsive.",
              publishedAt: "2026-05-18",
              readingTime: 10,
              topics: ["Animation", "Framer Motion"],
            },
            {
              id: "e2",
              title: "Designing for Accessibility Without Compromising Aesthetic",
              summary:
                "How to craft AAA-compliant color contrasts, keyboard focus loops, and ARIA landmarks seamlessly.",
              publishedAt: "2026-02-14",
              readingTime: 7,
              topics: ["A11y", "CSS"],
            },
            {
              id: "e3",
              title: "Component Anatomy: Crafting a Bulletproof Icon System",
              summary:
                "A deep-dive into SVG symbol optimization, tree-shaking icon bundles, and customizable wrappers.",
              publishedAt: "2025-12-01",
              readingTime: 5,
              topics: ["Design Systems", "React"],
            },
          ],
        },
      ],
    },
    {
      id: "saturn-c",
      name: "SYSTEMS & ENGINEERING",
      description: "Low-level system architecture, graphics rendering, and compiler pipelines.",
      articleCount: 8,
      color: "#ffaa44",
      position: new THREE.Vector3(35, 8, -20),
      connections: [{ from: "saturn-s", to: "earth-s" }],
      stars: [
        {
          id: "saturn-s",
          name: "SATURN",
          description:
            "Embedded operating systems, RTOS kernel performance, and GPU-accelerated graphics.",
          weight: 1.5,
          articleCount: 8,
          activity: "high",
          modelPath: "/models/saturn.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [
            {
              id: "qnx",
              name: "QNX RTOS",
              starId: "saturn-s",
              articleCount: 4,
              position: new THREE.Vector3(0, 1, 1),
            },
            {
              id: "rendering",
              name: "Graphics Engineering",
              starId: "saturn-s",
              articleCount: 4,
              position: new THREE.Vector3(1, -1, -1),
            },
          ],
          articles: [
            {
              id: "s1",
              title: "RTOS Kernel Scheduling and Priority Inversions",
              summary:
                "How QNX manages strict deadlines in mission-critical environments using priority inheritance.",
              publishedAt: "2026-07-22",
              readingTime: 15,
              topics: ["QNX", "Embedded Systems"],
            },
            {
              id: "s2",
              title: "The Math Behind GPU-Accelerated Fluid Simulations",
              summary:
                "Dissecting Navier-Stokes equations and implementing grid-based fluid solvers using WebGL shaders.",
              publishedAt: "2026-04-09",
              readingTime: 18,
              topics: ["Graphics", "WebGL"],
            },
            {
              id: "s3",
              title: "Building a Compiler: Abstract Syntax Trees in Rust",
              summary:
                "Writing a recursive-descent parser and compiling high-level tokens to optimized machine code.",
              publishedAt: "2025-10-14",
              readingTime: 11,
              topics: ["Rust", "Compilers"],
            },
          ],
        },
      ],
    },
  ],
};
