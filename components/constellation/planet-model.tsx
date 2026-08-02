"use client";

import { useGLTF, Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface PlanetModelProps {
  url: string;
  targetSize?: number;
  rotationSpeed?: number;
}

export function PlanetModel({ url, targetSize = 5, rotationSpeed = 1 }: PlanetModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();

    // Normalize scale: make the model fit within targetSize
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDim;
    clone.scale.setScalar(scale);

    return clone;
  }, [scene, targetSize]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005 * rotationSpeed;
    }
  });

  return (
    <Center>
      <primitive ref={modelRef} object={clonedScene} />
    </Center>
  );
}

// Preload models
useGLTF.preload("/models/saturn.glb");
useGLTF.preload("/models/earth.glb");
useGLTF.preload("/models/mercury.glb");
useGLTF.preload("/models/sun.glb");
