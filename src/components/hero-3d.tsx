import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import { useRef, Suspense } from "react";
import type { Mesh } from "three";

function Orb({ position, color, scale = 1, speed = 1 }: { position: [number, number, number]; color: string; scale?: number; speed?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
    ref.current.rotation.x = state.clock.elapsedTime * 0.1 * speed;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1, 32, 32]} position={position} scale={scale}>
        <MeshDistortMaterial color={color} distort={0.45} speed={1.6} roughness={0.15} metalness={0.4} />
      </Sphere>
    </Float>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} color="#7af0d8" />
          <directionalLight position={[-5, -2, -5]} intensity={0.8} color="#5aa9ff" />
          <Orb position={[-2.4, 0.4, 0]} color="#22d3b8" scale={1.3} speed={1.1} />
          <Orb position={[2.2, -0.6, -1]} color="#5aa9ff" scale={1.6} speed={0.7} />
          <Orb position={[0.3, 1.6, -1.5]} color="#7be3a4" scale={0.8} speed={1.4} />
          <Orb position={[1.2, -1.8, 0.5]} color="#ffb46b" scale={0.55} speed={1.6} />
          <Stars radius={20} depth={40} count={350} factor={2} fade speed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
}