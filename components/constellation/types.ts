import * as THREE from "three";

export type ActivityLevel = "high" | "medium" | "low";

export type Article = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime: number;
  topics: string[];
};

export type Topic = {
  id: string;
  name: string;
  starId: string;
  articleCount: number;
  position: THREE.Vector3; // Relative to star
};

export type Star = {
  id: string;
  name: string;
  description: string;
  weight: number;
  articleCount: number;
  activity: ActivityLevel;
  modelPath?: string;
  position: THREE.Vector3; // Relative to constellation
  topics: Topic[];
  articles: Article[];
};

export type StarConnection = {
  from: string;
  to: string;
};

export type Constellation = {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  position: THREE.Vector3;
  color: string;
  stars: Star[];
  connections: StarConnection[];
};

export type UniverseStats = {
  articles: number;
  topics: number;
  constellations: number;
  years: number;
};

export type UniverseData = {
  id: string;
  name: string;
  description: string;
  stats: UniverseStats;
  constellations: Constellation[];
};

export type ViewLevel = "universe" | "constellation" | "star" | "article";
