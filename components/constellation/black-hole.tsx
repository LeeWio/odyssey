"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";

export function BlackHole() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.2;
      outerRef.current.rotation.z = t * 0.1;
    }
    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    }
  });

  return (
    <group>
      {/* Event Horizon / Glow */}
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <Sphere ref={outerRef} args={[2.5, 64, 64]}>
          <MeshDistortMaterial
            color="#aa00ff"
            emissive="#aa00ff"
            emissiveIntensity={5}
            speed={3}
            distort={0.4}
            radius={1}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      {/* Dark Core */}
      <Sphere ref={innerRef} args={[1.8, 32, 32]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>

      {/* Accretion Disk - simple representation */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[2.8, 5, 64]} />
        <meshBasicMaterial
          color="#ff00ff"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight intensity={10} color="#aa00ff" distance={20} />
    </group>
  );
}
