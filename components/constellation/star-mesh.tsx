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
}

export function StarMesh({ name, position, activity, modelPath }: StarMeshProps) {
  const pulseSpeed = 1 + (activity === "high" ? 1 : activity === "medium" ? 0.5 : 0.2);

  return (
    <group position={position}>
      {/* Dynamic Label */}
      <Html position={[0, 10, 0]} center distanceFactor={15}>
        <div className="pointer-events-none rounded-2xl border border-white/20 bg-black/60 px-4 py-1.5 text-[12px] font-black tracking-widest text-white uppercase shadow-2xl backdrop-blur-xl select-none">
          {name}
        </div>
      </Html>

      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <group>
          {modelPath && <PlanetModel url={modelPath} targetSize={12} rotationSpeed={pulseSpeed} />}

          {/* Removed Sphere fallback to ensure we only see high-fidelity GLBs */}
        </group>
      </Float>
    </group>
  );
}
