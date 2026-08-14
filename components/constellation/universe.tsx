"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense, useState, useRef, useMemo } from "react";
import { universeData } from "./data";
import { StarMesh } from "./star-mesh";
import { GalacticBackground } from "./galactic-background";
import { Connection } from "./connection";
import { LocalDust } from "./local-dust";
import { ConstellationOrbits } from "./constellation-orbits";
import { ArticleSatellite } from "./article-satellite";
import { HUD } from "./hud";
import { DetailPanel } from "./detail-panel";
import { Star, ViewLevel } from "./types";
import { AnimatePresence } from "motion/react";
import { useFrame, useThree } from "@react-three/fiber";

export function UniverseView() {
  const [activeStar, setActiveStar] = useState<Star | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const viewLevel: ViewLevel = activeStar ? "star" : "universe";

  const handleViewChange = (level: ViewLevel) => {
    if (level === "universe") {
      setActiveStar(null);
    } else {
      // Find the first star to set active if transitioning to a star view
      const firstStar = universeData.constellations[0]?.stars[0];
      if (firstStar) setActiveStar(firstStar);
    }
  };

  const handleExplore = () => {
    setActiveStar(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020205]">
      {/* 3D Space Scene */}
      <Canvas dpr={[1, 2]} shadows>
        <color attach="background" args={["#000000"]} />

        {/* Cinematic Camera */}
        <PerspectiveCamera makeDefault position={[0, 40, 120]} fov={35} />

        <ambientLight intensity={1.5} />

        {/* Dynamic Studio Lighting */}
        <pointLight position={[-40, 20, 50]} intensity={12} color="#8888ff" />
        <pointLight position={[0, 20, 50]} intensity={12} color="#ffffff" />
        <pointLight position={[40, 20, 50]} intensity={12} color="#ffaa44" />
        <directionalLight position={[0, 80, 40]} intensity={1.5} />

        <Suspense fallback={null}>
          {/* Infinite Starry Backdrop */}
          <GalacticBackground />

          {/* Connected Knowledge Mesh */}
          <UniverseContent
            activeStar={activeStar}
            setActiveStar={setActiveStar}
            hoveredStar={hoveredStar}
            setHoveredStar={setHoveredStar}
          />

          {/* Smooth Camera Director */}
          <CameraController activeStar={activeStar} controlsRef={controlsRef} />

          <Environment preset="apartment" />
        </Suspense>

        {/* Interactive Space Navigation */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          panSpeed={1.5}
          target={[0, 0, 0]}
          minDistance={15}
          maxDistance={250}
        />

        {/* High-Fidelity Cinematic Post-Processing */}
        <EffectComposer multisampling={8}>
          <Bloom luminanceThreshold={0.4} intensity={1.2} radius={0.6} />
          <Vignette darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* Futuristic HUD overlay */}
      <HUD
        stats={universeData.stats}
        viewLevel={viewLevel}
        onViewChange={handleViewChange}
        onExplore={handleExplore}
      />

      {/* Floating Star detail panel */}
      <AnimatePresence mode="wait">
        {activeStar && <DetailPanel activeStar={activeStar} onClose={() => setActiveStar(null)} />}
      </AnimatePresence>
    </div>
  );
}

interface CameraControllerProps {
  activeStar: Star | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.MutableRefObject<any>;
}

function CameraController({ activeStar, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const tempTarget = useMemo(() => new THREE.Vector3(), []);
  const tempCamPos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    let targetX = 0,
      targetY = 0,
      targetZ = 0;
    let camX = 0,
      camY = 40,
      camZ = 120; // Default universe overview camera view

    if (activeStar) {
      // Find absolute world position of active star
      const starWorldPos = new THREE.Vector3(0, 0, 0);
      const constellation = universeData.constellations.find((c) =>
        c.stars.some((s) => s.id === activeStar.id)
      );
      if (constellation) {
        starWorldPos.addVectors(constellation.position, activeStar.position);
      }

      targetX = starWorldPos.x;
      targetY = starWorldPos.y;
      targetZ = starWorldPos.z;

      // Frame the selected star perfectly close up
      camX = starWorldPos.x + 18;
      camY = starWorldPos.y + 10;
      camZ = starWorldPos.z + 25;
    }

    tempTarget.set(targetX, targetY, targetZ);
    tempCamPos.set(camX, camY, camZ);

    // Smoothly lerp camera and controls target
    camera.position.lerp(tempCamPos, 0.05);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(tempTarget, 0.05);
      controlsRef.current.update();
    }
  });

  return null;
}

interface UniverseContentProps {
  activeStar: Star | null;
  setActiveStar: (star: Star | null) => void;
  hoveredStar: Star | null;
  setHoveredStar: (star: Star | null) => void;
}

function UniverseContent({
  activeStar,
  setActiveStar,
  hoveredStar,
  setHoveredStar,
}: UniverseContentProps) {
  // Render connection links between the constellation stars
  const connections = useMemo(() => {
    const rendered: React.ReactNode[] = [];
    const processed = new Set<string>();

    universeData.constellations.forEach((c) => {
      c.connections.forEach((conn) => {
        const key1 = `${conn.from}-${conn.to}`;
        const key2 = `${conn.to}-${conn.from}`;
        if (processed.has(key1) || processed.has(key2)) return;
        processed.add(key1);

        let startPos: THREE.Vector3 | null = null;
        let endPos: THREE.Vector3 | null = null;

        universeData.constellations.forEach((constell) => {
          constell.stars.forEach((star) => {
            if (star.id === conn.from) {
              startPos = new THREE.Vector3().addVectors(constell.position, star.position);
            }
            if (star.id === conn.to) {
              endPos = new THREE.Vector3().addVectors(constell.position, star.position);
            }
          });
        });

        if (startPos && endPos) {
          rendered.push(<Connection key={key1} start={startPos} end={endPos} color={c.color} />);
        }
      });
    });

    return rendered;
  }, []);

  return (
    <group>
      {/* Visual representation of structural gravity linkages */}
      {connections}

      {/* Main constellations group */}
      {universeData.constellations.map((constellation) => (
        <group key={constellation.id} position={constellation.position}>
          {/* Ethereal Rings around constellation systems */}
          <ConstellationOrbits color={constellation.color} opacity={0.12} />

          {/* Dense cloud of glowing local space dust particles */}
          <LocalDust color={constellation.color} count={220} radius={25} />

          {/* Render individual high fidelity planets as stars */}
          {constellation.stars.map((star) => (
            <StarMesh
              key={star.id}
              name={star.name}
              position={star.position}
              activity={star.activity}
              modelPath={star.modelPath}
              onClick={() => setActiveStar(star)}
              onPointerOver={() => setHoveredStar(star)}
              onPointerOut={() => setHoveredStar(null)}
              isActive={activeStar?.id === star.id}
              isHovered={hoveredStar?.id === star.id}
            />
          ))}
        </group>
      ))}

      {/* Render all article satellites in pure absolute world coordinates to prevent parent group double-offsetting */}
      {universeData.constellations.map((constellation) =>
        constellation.stars.map((star) => {
          const starWorldPos = new THREE.Vector3().addVectors(
            constellation.position,
            star.position
          );
          return star.articles.map((art, idx) => (
            <ArticleSatellite
              key={art.id}
              starPosition={starWorldPos}
              orbitRadius={14 + idx * 3.5}
              speed={0.5 + idx * 0.15}
            />
          ));
        })
      )}
    </group>
  );
}
