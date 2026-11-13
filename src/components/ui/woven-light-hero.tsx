"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import * as THREE from "three";

export interface WovenLightHeroProps {
  brand?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  /** Optional secondary text link under the CTA. */
  secondaryCta?: { label: string; href: string };
  /** Anchor links shown in the top nav (hidden on small screens). */
  links?: { label: string; href: string }[];
  /** Colour the bottom edge fades into, so the next section joins smoothly. */
  fadeTo?: string;
}

// --- Main Hero Component ---
export const WovenLightHero = ({
  brand = "Woven",
  headline = "Woven by Light",
  subline = "An interactive tapestry of light and motion, crafted with code and creativity.",
  ctaLabel = "Explore the Weave",
  ctaHref,
  onCtaClick,
  secondaryCta,
  links,
  fadeTo,
}: WovenLightHeroProps) => {
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    void textControls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05 + 0.6,
        duration: 1.0,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }));
    void buttonControls.start({
      opacity: 1,
      transition: { delay: 1.4, duration: 0.8 },
    });

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [textControls, buttonControls, headline]);

  return (
    <div className="relative flex h-dvh min-h-[560px] w-full flex-col items-center justify-center overflow-hidden bg-black dark:bg-white">
      <WovenCanvas />
      <HeroNav brand={brand} links={links} />
      <div className="relative z-10 px-4 text-center">
        <h1
          className="text-5xl text-white md:text-8xl dark:text-slate-900"
          style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 0 50px rgba(255, 255, 255, 0.3)" }}
        >
          {headline.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="inline-block">
              {word.split("").map((char, j) => (
                <motion.span
                  key={`${i}-${j}-${char}`}
                  custom={i * 5 + j}
                  initial={{ opacity: 0, y: 50 }}
                  animate={textControls}
                  style={{ display: "inline-block" }}
                >
                  {char}
                </motion.span>
              ))}
              {i < headline.split(" ").length - 1 ? <span>&nbsp;</span> : null}
            </span>
          ))}
        </h1>
        <motion.p
          custom={headline.length}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-6 max-w-xl text-lg text-slate-300 dark:text-slate-600"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {subline}
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={buttonControls} className="mt-10">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="inline-block rounded-full border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 dark:border-slate-800/20 dark:bg-slate-800/5 dark:text-slate-800 dark:hover:bg-slate-800/10"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCtaClick}
              className="cursor-pointer rounded-full border-2 border-white/20 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 dark:border-slate-800/20 dark:bg-slate-800/5 dark:text-slate-800 dark:hover:bg-slate-800/10"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {ctaLabel}
            </button>
          )}
          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              className="mt-5 block text-sm font-medium text-slate-300 underline-offset-4 hover:text-white hover:underline dark:text-slate-600"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </motion.div>
      </div>
      {fadeTo ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-40"
          style={{ background: `linear-gradient(180deg, transparent, ${fadeTo})` }}
        />
      ) : null}
    </div>
  );
};

// --- Navigation Component ---
const HeroNav = ({ brand, links }: { brand: string; links?: { label: string; href: string }[] }) => {
  return (
    <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.8 } }} className="absolute top-0 right-0 left-0 z-20 p-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white dark:text-slate-800">⎎</span>
          <span className="text-xl font-bold text-white dark:text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
            {brand}
          </span>
        </div>
        {links?.length ? (
          <ul className="hidden items-center gap-5 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-white/75 hover:text-white dark:text-slate-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.nav>
  );
};

// --- Three.js Canvas Component ---
const WovenCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    // --- Woven Silk ---
    const particleCount = 50000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    const torusKnot = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 32);

    for (let i = 0; i < particleCount; i++) {
      const vertexIndex = i % torusKnot.attributes.position.count;
      const x = torusKnot.attributes.position.getX(vertexIndex);
      const y = torusKnot.attributes.position.getY(vertexIndex);
      const z = torusKnot.attributes.position.getZ(vertexIndex);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.8, isDarkMode ? 0.5 : 0.7);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      blending: isDarkMode ? THREE.NormalBlending : THREE.AdditiveBlending,
      transparent: true,
      opacity: isDarkMode ? 1.0 : 0.8,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let frameId = 0;
    const currentPos = new THREE.Vector3();
    const originalPos = new THREE.Vector3();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const returnForce = new THREE.Vector3();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const mouseWorld = new THREE.Vector3(mouse.x * 3, mouse.y * 3, 0);

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        currentPos.set(positions[ix], positions[iy], positions[iz]);
        originalPos.set(originalPositions[ix], originalPositions[iy], originalPositions[iz]);
        velocity.set(velocities[ix], velocities[iy], velocities[iz]);

        const dist = currentPos.distanceTo(mouseWorld);
        if (dist < 1.5) {
          const force = (1.5 - dist) * 0.01;
          direction.subVectors(currentPos, mouseWorld).normalize();
          velocity.add(direction.multiplyScalar(force));
        }

        returnForce.subVectors(originalPos, currentPos).multiplyScalar(0.001);
        velocity.add(returnForce);
        velocity.multiplyScalar(0.95);

        positions[ix] += velocity.x;
        positions[iy] += velocity.y;
        positions[iz] += velocity.z;

        velocities[ix] = velocity.x;
        velocities[iy] = velocity.y;
        velocities[iz] = velocity.z;
      }
      geometry.attributes.position.needsUpdate = true;

      points.rotation.y = elapsedTime * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      torusKnot.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

export default WovenLightHero;
