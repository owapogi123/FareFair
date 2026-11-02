'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, useReducedMotion } from 'framer-motion';

/* ---------- Procedural Jeepney (boxes + cylinders) ---------- */
function Jeepney() {
  const groupRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion) return;
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.35;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[1.6, 0.7, 0.9]} />
        <meshStandardMaterial color="#B3203A" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.7, 0.15, 1.0]} />
        <meshStandardMaterial color="#8E1B2F" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.5, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.7]} />
        <meshStandardMaterial color="#141414" roughness={0.3} metalness={0.4} opacity={0.9} transparent />
      </mesh>
      {/* Wheels */}
      {[-0.65, 0.65].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.35, z]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#141414" roughness={0.8} />
          </mesh>
        ))
      )}
      {/* Grille */}
      <mesh position={[0.85, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Roof decor */}
      <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.25, 6]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

/* ---------- Procedural Bus ---------- */
function Bus() {
  const groupRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion) return;
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.25 + 1) * 0.3;
      groupRef.current.position.y = Math.sin(t * 1.1 + 0.5) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[2.2, 1.0, 1.0]} />
        <meshStandardMaterial color="#141414" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Windows strip */}
      <mesh position={[0, 0.15, 0.51]}>
        <boxGeometry args={[2.0, 0.5, 0.02]} />
        <meshStandardMaterial color="#87CEEB" roughness={0.1} metalness={0.8} opacity={0.7} transparent />
      </mesh>
      {/* Windshield */}
      <mesh position={[-1.0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.6, 0.7]} />
        <meshStandardMaterial color="#87CEEB" roughness={0.1} metalness={0.8} opacity={0.6} transparent side={2} />
      </mesh>
      {/* Wheels */}
      {[-0.9, 0.9].map((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.5, z]}>
            <cylinderGeometry args={[0.28, 0.28, 0.15, 16]} />
            <meshStandardMaterial color="#141414" roughness={0.8} />
          </mesh>
        ))
      )}
      {/* Fare sign */}
      <mesh position={[0, 0.7, 0.52]}>
        <boxGeometry args={[0.8, 0.3, 0.04]} />
        <meshStandardMaterial color="#B3203A" roughness={0.3} metalness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------- Floating Peso Coins ---------- */
function PesoCoins() {
  const coinsRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion) return;
    const t = state.clock.getElapsedTime();
    if (coinsRef.current) {
      coinsRef.current.rotation.y = t * 0.15;
      coinsRef.current.children.forEach((coin, i) => {
        coin.rotation.y = t * (0.5 + i * 0.2);
        coin.position.y = Math.sin(t * 1.5 + i) * 0.15;
      });
    }
  });

  return (
    <group ref={coinsRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.7, 0, Math.sin(i * 2.1) * 0.7]}>
          <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
          <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Scene with Lights ---------- */
function AdScene({ variant }: { variant: 'jeepney' | 'bus' | 'coins' }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.6} />
      {variant === 'jeepney' && <Jeepney />}
      {variant === 'bus' && <Bus />}
      {variant === 'coins' && <PesoCoins />}
    </>
  );
}

/* ---------- Canvas Wrapper (lazy, mobile-friendly) ---------- */
function AdCanvas({ variant }: { variant: 'jeepney' | 'bus' | 'coins' }) {
  const reduceMotion = useReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0.2, 2.5], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <AdScene variant={variant} />
      {!reduceMotion && <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />}
    </Canvas>
  );
}

/* ---------- Public Component ---------- */
interface Ad3DProps {
  variant?: 'jeepney' | 'bus' | 'coins';
  className?: string;
  fallback?: React.ReactNode;
}

export function Ad3D({ variant = 'jeepney', className = '', fallback }: Ad3DProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={`aspect-square max-w-48 mx-auto ${className}`}>
        {fallback ?? (
          <div className="w-full h-full flex items-center justify-center bg-[var(--ff-tint-soft)] rounded-2xl">
            <span className="text-4xl">🚌</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative aspect-square max-w-48 mx-auto overflow-hidden rounded-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ willChange: 'transform, opacity' }}
    >
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-[var(--ff-tint-soft)]" />}>
        <AdCanvas variant={variant} />
      </Suspense>
    </motion.div>
  );
}

/* Need to import THREE for types */
import * as THREE from 'three';