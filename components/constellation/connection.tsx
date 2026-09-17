"use client";

import { QuadraticBezierLine } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ConnectionProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color?: string;
  opacity?: number;
}

export function Connection({ start, end, color = "#44aaff", opacity = 0.3 }: ConnectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);

  const mid = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    m.y += start.distanceTo(end) * 0.3;
    return m;
  }, [start, end]);

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.dashOffset -= 0.01;
    }
  });

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={start}
      end={end}
      mid={mid}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
      dashed
      dashScale={4}
      gapSize={2}
    />
  );
}
