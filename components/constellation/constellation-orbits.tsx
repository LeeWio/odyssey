"use client";

import * as THREE from "three";

interface ConstellationOrbitsProps {
  color: string;
  opacity?: number;
}

export function ConstellationOrbits({ color, opacity = 0.1 }: ConstellationOrbitsProps) {
  return (
    <group rotation={[Math.PI / 2.5, 0, 0]}>
      {/* 3 Concentric Rings */}
      <mesh>
        <ringGeometry args={[8, 8.05, 128]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[12, 12.05, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[16, 16.05, 128]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
