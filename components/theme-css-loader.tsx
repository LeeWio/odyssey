"use client";

export function ThemeCSSLoader() {
  // Since all theme variants are bundled in globals.css with correct cascade layer priorities,
  // we no longer need to dynamically load or inject link tags into the document head.
  // This completely eliminates any separate theme file network loads and prevents FOUC.
  return null;
}
