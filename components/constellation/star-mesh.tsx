"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { ActivityLevel } from "./types";

interface StarMeshProps {
  name: string;
  position: THREE.Vector3;
  activity: ActivityLevel;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  isHovered?: boolean;
  isActive?: boolean;
}

export function StarMesh({
  name,
  position,
  activity,
  onClick,
  onPointerOver,
  onPointerOut,
  isHovered = false,
  isActive = false,
}: StarMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseSpeed = 0.4 + (activity === "high" ? 0.8 : activity === "medium" ? 0.45 : 0.2);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * pulseSpeed * 0.35;
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        onPointerOut?.();
      }}
    >
      <Html position={[0, 10, 0]} center distanceFactor={15}>
        <div
          className={`pointer-events-none rounded-2xl border px-4 py-1.5 text-[12px] font-black tracking-widest uppercase shadow-2xl backdrop-blur-xl transition-all duration-300 select-none ${
            isActive
              ? "scale-110 border-cyan-500 bg-cyan-950/80 text-cyan-400"
              : isHovered
                ? "scale-105 border-white/40 bg-black/80 text-white"
                : "border-white/20 bg-black/60 text-white"
          }`}
        >
          {name}
        </div>
      </Html>

      <group scale={isActive ? 1.2 : isHovered ? 1.08 : 1.0}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[4.5, 24, 24]} />
          <meshStandardMaterial
            color={isHovered ? "#dbeafe" : "#94a3b8"}
            emissive={isActive ? "#22d3ee" : "#334155"}
            emissiveIntensity={isActive ? 1.4 : 0.55}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
