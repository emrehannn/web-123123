"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /* ─── scroll parallax ─── */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  /* ─── on-load intro (instant when reduced motion) ─── */
  const introTransition = (delay: number, duration: number) => ({
    duration: prefersReducedMotion ? 0 : duration,
    ease,
    delay: prefersReducedMotion ? 0 : delay,
  });

  const stagger = (index: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: introTransition(0.2 + index * 0.08, 0.5),
  });

  return (
    <motion.section
      ref={sectionRef}
      id="about"
      className="hero"
      aria-labelledby="hero-heading"
    >
      <motion.div className="hero__content shell" style={{ y: prefersReducedMotion ? 0 : contentY }}>
        <motion.div className="hero__eyebrow" {...stagger(0)}>
          <span className="signal-dot signal-dot--hero" aria-hidden="true" />
          Independent game studio · Mobile &amp; PC
        </motion.div>

        <h1 id="hero-heading" className="hero__title">
          <motion.span {...stagger(1)} style={{ display: "block" }}>
            Games built
          </motion.span>
          <motion.span className="hero__outline" {...stagger(2)}>to keep <em>moving.</em></motion.span>
        </h1>
      </motion.div>
      <div className="hero__cinema shell">
        <motion.div className="hero__image-wrap" style={{ y: prefersReducedMotion ? 0 : imageY }}>
          <Image
            src="/images/walkin-about-hero.png"
            alt="Walkin gameplay scene with a runner escaping through a city street"
            fill
            preload
            unoptimized
            sizes="100vw"
            className="hero__image"
          />
        </motion.div>
        <div className="hero__shade" aria-hidden="true" />
        <a href="#project-walkin" className="hero__featured">
          <span className="signal-dot signal-dot--hero" aria-hidden="true" />
          In development <span className="hero__featured-name">Walkin</span>
          <Image
            className="hero__featured-icon"
            src="/images/walkin-icon.png"
            alt=""
            width={56}
            height={56}
            sizes="56px"
            preload
          />
        </a>
        <motion.div className="hero__footer" {...stagger(3)}>
          <p className="hero__intro">
            WalkinGames creates focused, replayable experiences with strong
            atmosphere, responsive systems, and worlds that invite one more run.
          </p>
          <div className="hero__actions">
            <motion.a
              className="button button--solid"
              href="#games"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={introTransition(0.72, 0.6)}
            >
              <span>Explore our games</span>
              <span className="button__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m7 5 5 5-5 5" />
                </svg>
              </span>
            </motion.a>
            <motion.a
              className="text-link"
              href="#direction"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={introTransition(0.78, 0.6)}
            >
              <span>See where we&apos;re going</span>
              <span className="text-link__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m7 5 5 5-5 5" />
                </svg>
              </span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
