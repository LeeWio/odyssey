"use client";

import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { ActivityLevel } from "./types";
import { PlanetModel } from "./planet-model";

interface StarMeshProps {
  name: string;
  position: THREE.Vector3;
  activity: ActivityLevel;
  modelPath?: string;
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
  modelPath,
  onClick,
  onPointerOver,
  onPointerOut,
  isHovered = false,
  isActive = false,
}: StarMeshProps) {
  const pulseSpeed = 1 + (activity === "high" ? 1 : activity === "medium" ? 0.5 : 0.2);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        if (onPointerOver) onPointerOver();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        if (onPointerOut) onPointerOut();
      }}
    >
      {/* Dynamic Label */}
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

      <Float speed={isActive ? 4 : 2} rotationIntensity={0.3} floatIntensity={0.3}>
        <group scale={isActive ? 1.2 : isHovered ? 1.08 : 1.0}>
          {modelPath && (
            <PlanetModel
              url={modelPath}
              targetSize={12}
              rotationSpeed={isActive ? pulseSpeed * 2 : pulseSpeed}
            />
          )}
        </group>
      </Float>
    </group>
  );
}
