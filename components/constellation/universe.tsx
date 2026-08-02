"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import { universeData } from "./data";
import { StarMesh } from "./star-mesh";

export function UniverseView() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020205]">
      <Canvas dpr={[1, 2]} shadows>
        <color attach="background" args={["#000000"]} />

        {/* Wider Camera to see all 3 models in frame */}
        <PerspectiveCamera makeDefault position={[0, 40, 150]} fov={35} />

        <ambientLight intensity={2} />

        {/* Strategic lights for all 3 planets */}
        <pointLight position={[-30, 20, 50]} intensity={15} color="#aaaaaa" />
        <pointLight position={[0, 20, 50]} intensity={15} color="#ffffff" />
        <pointLight position={[30, 20, 50]} intensity={15} color="#ffaa44" />

        <directionalLight position={[0, 100, 50]} intensity={2} />

        <Suspense fallback={null}>
          <UniverseContent />
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls
          enableDamping
          rotateSpeed={0.5}
          panSpeed={1.5}
          target={[0, 0, 0]}
          minDistance={20}
          maxDistance={400}
        />

        <EffectComposer multisampling={8}>
          <Bloom luminanceThreshold={0.5} intensity={1} radius={0.5} />
          <Vignette darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* HUD Hint */}
      <div className="pointer-events-none absolute top-10 left-10 opacity-40">
        <h1 className="text-3xl font-black tracking-tighter text-white italic">PLANET GALLERY</h1>
        <p className="mt-2 text-[10px] tracking-widest text-white/40 uppercase">
          Horizontal Alignment Active
        </p>
      </div>
    </div>
  );
}

function UniverseContent() {
  return (
    <group>
      {universeData.constellations.map((constellation) => (
        <group key={constellation.id} position={constellation.position}>
          {constellation.stars.map((star) => (
            <StarMesh
              key={star.id}
              name={star.name}
              position={star.position}
              weight={star.weight}
              activity={star.activity}
              modelPath={star.modelPath}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
