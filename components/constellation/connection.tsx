"use client";

import { QuadraticBezierLine, Sparkles } from "@react-three/drei";
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
  const lineRef = useRef<THREE.Mesh & { dashOffset: number }>(null);

  // 3. Gravity Link: Bezier curve mid-point
  const mid = useMemo(() => {
    const m = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    m.y += start.distanceTo(end) * 0.3; // Gravitational arc
    return m;
  }, [start, end]);

  useFrame(() => {
    if (lineRef.current) {
      // 3. Energy Flow: Animate dash offset
      lineRef.current.dashOffset -= 0.01;
    }
  });

  return (
    <group>
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

      {/* 3. Energy Flow: Subtle ethereal glow instead of sharp sparkles */}
      <group position={mid}>
        <Sparkles
          count={3}
          scale={start.distanceTo(end) * 0.4}
          size={0.5}
          speed={0.1}
          color={color}
          opacity={0.1}
        />
      </group>
    </group>
  );
}
