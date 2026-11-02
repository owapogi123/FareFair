'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useReducedMotion } from 'framer-motion';

gsap.registerPlugin();

/* ---------- Premium Jeepney Model ---------- */
function Jeepney({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.2) * 0.02;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.008;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Chassis / Undercarriage */}
      <mesh castShadow receiveShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[2.2, 0.15, 0.95]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Main Body - Lower */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[2.1, 0.8, 0.9]} />
        <meshPhysicalMaterial
          color="#c8cbd1"
          roughness={0.35}
          metalness={0.65}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Main Body - Upper (passenger cabin) */}
      <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[2.0, 0.85, 0.85]} />
        <meshPhysicalMaterial
          color="#d4d7dc"
          roughness={0.3}
          metalness={0.6}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Roof */}
      <mesh castShadow receiveShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[2.15, 0.12, 0.95]} />
        <meshPhysicalMaterial
          color="#8C203D"
          roughness={0.25}
          metalness={0.7}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Roof front curve */}
      <mesh castShadow receiveShadow position={[0.95, 1.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.95, 16, 1, true, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#8C203D" roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Roof rear curve */}
      <mesh castShadow receiveShadow position={[-0.95, 1.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.95, 16, 1, true, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial color="#8C203D" roughness={0.25} metalness={0.7} />
      </mesh>

      {/* Front Grille Area */}
      <mesh castShadow receiveShadow position={[1.1, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.7]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Grille Details - Horizontal bars */}
      {[-0.2, -0.05, 0.1, 0.25].map((y) => (
        <mesh key={`grille-${y}`} castShadow receiveShadow position={[1.13, y, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.6]} />
          <meshStandardMaterial color="#2a2a3e" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[1.13, 0.25, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshPhysicalMaterial
          color="#fff8e7"
          transmission={0.9}
          thickness={0.5}
          roughness={0}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
      <mesh position={[1.13, 0.25, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshPhysicalMaterial
          color="#fff8e7"
          transmission={0.9}
          thickness={0.5}
          roughness={0}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* Headlight bezels */}
      <mesh position={[1.13, 0.25, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 16]} />
        <meshStandardMaterial color="#c8cbd1" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[1.13, 0.25, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 16]} />
        <meshStandardMaterial color="#c8cbd1" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Turn signals */}
      <mesh position={[1.13, 0.05, 0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ff8c00" emissive="#ff8c00" emissiveIntensity={0.3} roughness={0.3} metalness={0} />
      </mesh>
      <mesh position={[1.13, 0.05, -0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ff8c00" emissive="#ff8c00" emissiveIntensity={0.3} roughness={0.3} metalness={0} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0.55, 1.1, 0]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[1.6, 0.7]} />
        <meshPhysicalMaterial
          color="#1a2a3a"
          transmission={0.85}
          thickness={0.3}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          opacity={0.4}
          transparent
          side={2}
        />
      </mesh>

      {/* Windshield frame */}
      <mesh position={[0.55, 1.1, 0]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[1.6, 0.7]} />
        <meshStandardMaterial color="#c8cbd1" roughness={0.2} metalness={0.7} opacity={0} transparent />
      </mesh>

      {/* Side Windows - Driver side */}
      <mesh position={[-0.1, 1.0, 0.48]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[1.3, 0.5]} />
        <meshPhysicalMaterial
          color="#1a2a3a"
          transmission={0.8}
          thickness={0.3}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          opacity={0.35}
          transparent
          side={2}
        />
      </mesh>

      {/* Side Windows - Passenger side */}
      <mesh position={[-0.1, 1.0, -0.48]} rotation={[0, 0, -Math.PI / 2]}>
        <planeGeometry args={[1.3, 0.5]} />
        <meshPhysicalMaterial
          color="#1a2a3a"
          transmission={0.8}
          thickness={0.3}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          opacity={0.35}
          transparent
          side={2}
        />
      </mesh>

      {/* Rear Window */}
      <mesh position={[-1.05, 1.0, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.6, 0.6]} />
        <meshPhysicalMaterial
          color="#1a2a3a"
          transmission={0.8}
          thickness={0.3}
          roughness={0.05}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          opacity={0.4}
          transparent
          side={2}
        />
      </mesh>

      {/* Side Entry - Passenger side */}
      <mesh castShadow receiveShadow position={[-0.1, 0.15, -0.5]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[1.0, 0.65, 0.05]} />
        <meshPhysicalMaterial
          color="#c8cbd1"
          roughness={0.35}
          metalness={0.6}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Entry step */}
      <mesh castShadow receiveShadow position={[-0.1, -0.25, -0.5]}>
        <boxGeometry args={[0.8, 0.08, 0.25]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Front Bumper */}
      <mesh castShadow receiveShadow position={[1.05, 0.02, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.85]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Rear Bumper */}
      <mesh castShadow receiveShadow position={[-1.15, 0.02, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.85]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Wheels - Front Right */}
      <Wheel position={[0.7, -0.15, 0.5]} />
      {/* Wheels - Front Left */}
      <Wheel position={[0.7, -0.15, -0.5]} />
      {/* Wheels - Rear Right */}
      <Wheel position={[-0.7, -0.15, 0.5]} />
      {/* Wheels - Rear Left */}
      <Wheel position={[-0.7, -0.15, -0.5]} />

      {/* Fare sign on roof */}
      <mesh position={[0, 1.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.6, 0.03, 0.25]} />
        <meshPhysicalMaterial color="#FFD700" roughness={0.2} metalness={0.8} emissive="#FFD700" emissiveIntensity={0.1} />
      </mesh>

      {/* Small FareFair logo on side */}
      <mesh position={[-0.1, 0.6, 0.485]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial color="#8C203D" transparent opacity={0.9} side={2} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Wheel({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const wheelRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion || !wheelRef.current) return;
    const t = state.clock.getElapsedTime();
    wheelRef.current.rotation.x = -t * 0.5;
    wheelRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.005;
  });

  return (
    <group ref={wheelRef} position={position}>
      {/* Tire */}
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 0.14, 24]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Rim */}
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
        <meshPhysicalMaterial color="#c8cbd1" roughness={0.25} metalness={0.75} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>

      {/* Rim inner detail */}
      <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, -0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Lug nuts */}
      {[0, 72, 144, 216, 288].map((deg) => (
        <mesh key={deg} position={[
          Math.cos((deg * Math.PI) / 180) * 0.12,
          Math.sin((deg * Math.PI) / 180) * 0.12,
          0
        ]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 6]} />
          <meshStandardMaterial color="#a0a3a8" roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Studio Ground ---------- */
function StudioGround() {
  return (
    <group>
      {/* Main floor */}
      <mesh receiveShadow position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60, 100, 100]} />
        <meshStandardMaterial
          color="#F0F2F4"
          roughness={0.85}
          metalness={0.0}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Subtle gradient overlay for depth */}
      <mesh receiveShadow position={[0, -0.349, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial
          color="#E8EBEF"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Contact shadow plane - more realistic */}
      <mesh position={[0, -0.348, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ---------- Subtle Particles ---------- */
function SubtleParticles({ count = 60, area = 20, color = "#8C203D", opacity = 0.08, size = 0.05 }: { count?: number; area?: number; color?: string; opacity?: number; size?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const reduceMotion = useReducedMotion();

  useFrame((state) => {
    if (reduceMotion || !pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.005;
    const positions = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(t * 0.3 + i * 0.05) * 0.0008;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area;
      positions[i * 3 + 1] = Math.random() * area * 0.6 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [count, area]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial
        attach="material"
        color={color}
        size={size}
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  );
}

/* ---------- Scene Content (Single Hero Scene) ---------- */
function HeroSceneContent() {
  return (
    <>
      <StudioGround />
      <Jeepney position={[0, 0, -0.3]} rotation={[0, -0.35, 0]} scale={1.15} />
      <SubtleParticles count={40} area={25} color="#8C203D" opacity={0.06} size={0.04} />
      <SubtleParticles count={30} area={25} color="#FFD700" opacity={0.04} size={0.03} />
    </>
  );
}

/* ---------- Inner Scene Component (runs INSIDE Canvas) ---------- */
function CinematicScene() {
  const { camera } = useThree();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useFrame(() => {
    if (!mounted) return;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 35;
    }
    // Front three-quarter view, slightly elevated
    camera.position.set(3.5, 0.8, 3.5);
    camera.lookAt(0, 0.5, -0.3);
    camera.updateProjectionMatrix();
  });

  return (
    <>
      <color attach="background" args={["#F8F9FA"]} />
      <fog attach="fog" args={["#F8F9FA", 20, 60]} />

      {/* Studio Lighting Setup */}
      <ambientLight intensity={0.6} color="#ffffff" />

      {/* Key Light - Large soft from front-left */}
      <directionalLight position={[8, 12, 5]} intensity={1.8} color="#fffef8" castShadow>
        <orthographicCamera attach="shadowCamera" args={[-12, 12, 12, -12, 0.1, 40]} />
      </directionalLight>

      {/* Fill Light - Gentle from front-right */}
      <directionalLight position={[-5, 6, 8]} intensity={0.7} color="#f0f4ff" />

      {/* Rim Light - Separation from back */}
      <directionalLight position={[0, 8, -10]} intensity={0.5} color="#fffef8" />

      {/* Top Soft Light - Overall illumination */}
      <hemisphereLight color="#ffffff" groundColor="#e8ebef" intensity={0.4} />

      <HeroSceneContent />
    </>
  );
}

/* ---------- Main Cinematic Canvas (outer wrapper) ---------- */
interface CinematicCanvasProps {
  className?: string;
}

export function CinematicCanvas({ className = '' }: CinematicCanvasProps) {
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Canvas
      camera={{ position: [3.5, 0.8, 3.5], fov: 35, lookAt: [0, 0.5, -0.3] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        preserveDrawingBuffer: false,
        logarithmicDepthBuffer: true,
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      className={className}
      shadows={!reduceMotion}
    >
      <CinematicScene />
    </Canvas>
  );
}