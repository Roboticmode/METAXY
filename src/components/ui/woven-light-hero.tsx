"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import ElsewhereHero, { type ElsewhereLink } from "@/components/ui/elsewhere-hero";

export interface WovenLightHeroProps {
  brand?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  navCta?: ElsewhereLink | false;
  secondaryCta?: ElsewhereLink;
  links?: ElsewhereLink[];
  fadeTo?: string;
}

/**
 * Hero variant 2 (Woven Light): identical layout, typography, nav and CTAs to Hero 1 (ElsewhereHero),
 * rendered on a light background (#f5f3ec) with the Three.js woven particle animation replacing the video.
 */
export const WovenLightHero = ({
  brand = "METAXY",
  headline = "From hustle to formal business.",
  subline = "An AI agent that answers your clients, chases payments and walks you through CIPC and SARS, with a command centre where you see and approve everything it does.",
  ctaLabel = "Try the live demo",
  ctaHref = "/dashboard",
  onCtaClick,
  navCta,
  secondaryCta,
  links,
  fadeTo,
}: WovenLightHeroProps) => {
  return (
    <ElsewhereHero
      tone="light"
      background={<WovenCanvas />}
      brand={brand}
      links={links}
      navCta={navCta ?? { label: ctaLabel, href: ctaHref }}
      headline={headline}
      subline={subline}
      primaryCta={{ label: ctaLabel, href: ctaHref, onClick: onCtaClick }}
      secondaryCta={secondaryCta}
      sound={false}
      fadeTo={fadeTo}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    />
  );
};

/** Interactive 50,000-particle Three.js TorusKnot weave tuned for a light (#f5f3ec) hero surface. */
export function WovenCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

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
      color.setHSL(Math.random(), 0.78, 0.44);
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
      size: 0.022,
      vertexColors: true,
      blending: THREE.NormalBlending,
      transparent: true,
      opacity: 0.88,
    });

    const points = new THREE.Points(geometry, material);
    points.position.y = -0.25;
    scene.add(points);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      mouse.x = ((event.clientX - rect.left) / w) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / h) * 2 + 1;
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
      const mouseWorld = new THREE.Vector3(mouse.x * 3, mouse.y * 3 + 0.25, 0);

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

    if (reducedMotion) {
      renderer.render(scene, camera);
    } else {
      animate();
    }

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (reducedMotion) renderer.render(scene, camera);
    };

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(handleResize) : null;
    ro?.observe(container);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      ro?.disconnect();
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

  return <div ref={mountRef} className="absolute inset-0 h-full w-full" />;
}

export default WovenLightHero;
