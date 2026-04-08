"use client";

import * as React from "react";

import type { PlateLeafProps } from "platejs/react";

import { PlateLeaf } from "platejs/react";

export function KbdLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="kbd" className="kbd">
      {props.children}
    </PlateLeaf>
  );
}
