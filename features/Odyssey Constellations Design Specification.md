# Odyssey Constellations Design Specification

## 1. Overview

Constellations is a knowledge visualization system for the Odyssey
personal website.

The goal is not to create a traditional blog category system, but to
represent the author's knowledge, interests, experiences, and articles
as a living universe.

The core idea:

> A personal universe composed of connected ideas.

The system hierarchy:

    Universe
        |
    Constellation
        |
    Star
        |
    Topic
        |
    Article

---

# 2. Design Philosophy

Traditional blog:

    Category
        |
        Article

Constellations:

    Universe

        |
        |
    Constellation

        |
        |
    Star

        |
        |
    Topic

        |
        |
    Article

The difference:

- Categories describe storage.
- Constellations describe relationships.
- Stars represent long-term interests.
- Articles are individual knowledge fragments.

---

# 3. Universe Layer

## Concept

Universe represents the entire Odyssey knowledge space.

It is the first-level view users see.

It answers:

> What makes up this person's world?

Example:

                    Design


          Engineering        Photography



                      ◎

                    Odyssey



              Life          Travel

---

## Data Model

```ts
type Universe = {
  id: string;

  name: string;

  description: string;

  core: CoreNode;

  constellations: Constellation[];
};
```

---

## Core Node

The center of the universe.

It is not a logo.

It represents the intersection of all interests.

```ts
type CoreNode = {
  name: string;

  subtitle: string;
};
```

Example:

    Odyssey

    Notes, experiments and discoveries.

---

# 4. Constellation Layer

## Concept

A Constellation represents a major domain.

Examples:

    Engineering

    Design

    Life

    Travel

    Photography

A constellation is not a category list.

It contains connected stars.

---

## Data Model

```ts
type Constellation = {
  id: string;

  name: string;

  description: string;

  stars: Star[];

  connections: StarConnection[];
};
```

---

# 5. Star Layer

## Concept

A Star represents a long-term area of exploration.

Examples:

Engineering:

            Display


    Camera          Audio


            QNX


          Android

A Star is the gravitational center of related knowledge.

---

## Data Model

```ts
type Star = {
  id: string;

  name: string;

  description: string;

  weight: number;

  articleCount: number;

  activity: number;

  topics: Topic[];
};
```

---

## Star Visual Rules

Star size depends on:

    importance
    +
    article count
    +
    recent activity

Example:

    QNX

    large star


    Photography

    small star

---

# 6. Topic Layer

## Concept

Topic is the actual knowledge unit.

A Topic connects articles and stars.

Example:

    Display

        MIPI DSI

        SerDes

        HDCP

        DRM

---

## Data Model

```ts
type Topic = {
  id: string;

  name: string;

  starId: string;

  articles: Article[];
};
```

---

# 7. Article Layer

## Concept

Articles are not stars.

Articles are satellites around knowledge areas.

Reason:

Article count grows continuously.

If every article becomes a star:

    *
    *
    *
    *
    *
    *

The universe becomes unusable.

Therefore:

    Star

      ○ Article

      ○ Article

      ○ Article

---

## Data Model

```ts
type Article = {
  id: string;

  title: string;

  summary: string;

  publishedAt: string;

  readingTime: number;

  topics: Topic[];
};
```

---

# 8. Relationship System

Stars and articles can have multiple relationships.

Do not use simple parent-child structures.

Example:

Article:

    HDCP Explained

belongs to:

    Display

    Security

    Automotive

---

## Relation Model

```ts
type Relation = {
  from: string;

  to: string;

  weight: number;

  type: "core" | "related" | "inspired";
};
```

---

# 9. Spatial Model

## Universe View

Displays constellations.

Example:

            Design


    Engineering        Life


              ◎


    Photography

---

## Constellation View

Displays stars.

Example:

                  Display


    Camera                     Audio


                  ◎


                 QNX


              Android

---

## Star View

Displays articles.

Example:

              ○


        ○          ○


              ★


        ○          ○

---

# 10. Layout Strategy

## First Version

Use manually defined positions.

Reason:

Design control is more important than automatic generation.

Example:

```ts
{
 id:"display",

 position:{
   x:300,
   y:200
 }
}
```

---

## Future Version

Possible use:

- d3-force
- graph layout algorithms

But not required initially.

---

# 11. Article Orbit System

Articles orbit around stars.

Position calculation:

    x = centerX + cos(angle) * radius

    y = centerY + sin(angle) * radius

Example:

```ts
function getArticlePosition(index, total, radius) {
  const angle = (index / total) * Math.PI * 2;

  return {
    x: center.x + Math.cos(angle) * radius,

    y: center.y + Math.sin(angle) * radius,
  };
}
```

---

# 12. Animation Rules

## Initial Load

Sequence:

1.  Background appears
2.  Core appears
3.  Constellations appear
4.  Stars appear

---

## Star Appearance

Animation:

    opacity:

    0 -> 1


    scale:

    0.8 -> 1

---

## New Article

When a new article is created:

    new satellite appears

    scale:
    0 -> 1

    opacity:
    0 -> 1

Like a new star being born.

---

# 13. Interaction Rules

## Hover

Selected object:

    opacity: 1

Other objects:

    opacity: 0.2 - 0.4

---

## Click Constellation

Transition:

    Universe View

            ↓

    Constellation View

---

## Click Star

Transition:

    Constellation View

            ↓

    Star System View

---

# 14. Camera System

The visualization requires camera states.

```ts
type ViewState = {
  scale: number;

  x: number;

  y: number;
};
```

Examples:

Universe:

    scale:1

Constellation:

    scale:2.5

---

# 15. Technical Implementation

Recommended stack:

    React

    SVG

    Motion / Framer Motion

    react-zoom-pan-pinch

Avoid:

- Canvas
- Three.js
- WebGL

Reason:

The number of nodes is limited and SVG provides better interaction.

---

# 16. Component Structure

Recommended:

    components/

     constellation/

     ├── constellation.tsx

     ├── universe.tsx

     ├── galaxy.tsx

     ├── star.tsx

     ├── article-satellite.tsx

     ├── connection.tsx

     ├── detail-panel.tsx

     ├── types.ts

     └── data.ts

---

# 17. MVP Implementation Plan

## Phase 1

Implement:

- Universe
- One Constellation
- Several Stars
- Article satellites
- Hover interaction
- Click transition

Example:

Engineering:

    QNX

    Display

    Camera

    Audio

    Android

---

## Phase 2

Add:

- Multiple constellations
- Relationships
- Zoom navigation
- Detail panels

---

## Phase 3

Add:

- Dynamic article generation
- CMS integration
- AI topic recommendation
- Knowledge graph

---

# 18. Final Vision

The final system should feel like:

    A personal knowledge universe.

    Every article is a small satellite.

    Every topic is a planet.

    Every interest becomes a star.

    Together they form a constellation.

The user should not feel:

"I am browsing a blog."

They should feel:

"I am exploring someone's world."
