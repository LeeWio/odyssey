"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Trail } from "@react-three/drei";
import * as THREE from "three";

interface ArticleSatelliteProps {
  starPosition: THREE.Vector3;
  orbitRadius: number;
  speed?: number;
}

// Simple deterministic pseudo-random generator to maintain purity during render
function seedRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function ArticleSatellite({ starPosition, orbitRadius, speed = 1 }: ArticleSatelliteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Randomize orbit inclination and offset using position as a stable seed
  const { inclination, offset, rotationSpeed } = useMemo(() => {
    const seed = starPosition.x + starPosition.y + starPosition.z;
    return {
      inclination: (seedRandom(seed) - 0.5) * Math.PI * 0.3,
      offset: seedRandom(seed + 1) * Math.PI * 2,
      rotationSpeed: (0.2 + seedRandom(seed + 2) * 0.3) * speed,
    };
  }, [starPosition, speed]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * rotationSpeed + offset;

    // 4. Dynamic Effect: Orbital Revolution (Public Transit)
    groupRef.current.position.set(
      Math.cos(time) * orbitRadius,
      Math.sin(time) * Math.sin(inclination) * orbitRadius,
      Math.sin(time) * Math.cos(inclination) * orbitRadius
    );

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group position={starPosition}>
      <group ref={groupRef}>
        {/* 3. Energy Flow: Subtle smooth trail */}
        <Trail width={0.2} length={2} color="#00ffff" attenuation={(t) => t * t}>
          <Sphere ref={meshRef} args={[0.06, 16, 16]}>
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </Sphere>
        </Trail>
      </group>
    </group>
  );
}
