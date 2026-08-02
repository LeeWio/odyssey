import * as THREE from "three";
import { UniverseData } from "./types";

export const universeData: UniverseData = {
  id: "odyssey",
  name: "Planet Gallery",
  description: "High Fidelity View",
  stats: { articles: 0, topics: 0, constellations: 0, years: 0 },
  constellations: [
    {
      id: "mercury-c",
      name: "MERCURY",
      description: "Mercury",
      articleCount: 0,
      color: "#aaaaaa",
      position: new THREE.Vector3(-25, 0, 0), // Moved closer
      connections: [],
      stars: [
        {
          id: "mercury-s",
          name: "MERCURY",
          description: "Mercury Planet",
          weight: 1.0,
          articleCount: 0,
          activity: "high",
          modelPath: "/models/mercury.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [],
          articles: [],
        },
      ],
    },
    {
      id: "earth-c",
      name: "EARTH",
      description: "Earth",
      articleCount: 0,
      color: "#00aaff",
      position: new THREE.Vector3(0, 0, 0), // Center
      connections: [],
      stars: [
        {
          id: "earth-s",
          name: "EARTH",
          description: "Earth Planet",
          weight: 1.0,
          articleCount: 0,
          activity: "high",
          modelPath: "/models/earth.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [],
          articles: [],
        },
      ],
    },
    {
      id: "saturn-c",
      name: "SATURN",
      description: "Saturn",
      articleCount: 0,
      color: "#ffaa44",
      position: new THREE.Vector3(25, 0, 0), // Moved closer
      connections: [],
      stars: [
        {
          id: "saturn-s",
          name: "SATURN",
          description: "Saturn Planet",
          weight: 1.0,
          articleCount: 0,
          activity: "high",
          modelPath: "/models/saturn.glb",
          position: new THREE.Vector3(0, 0, 0),
          topics: [],
          articles: [],
        },
      ],
    },
  ],
};
