"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

/* ─── background art ───
   Pre-encoded by scripts/build-hero-image.mjs: the full-bleed backdrop is the LCP
   element, so the browser gets AVIF first, WebP next, and only ever downloads the
   width it actually renders. */
const heroBackground = {
  src: "/images/hero/walkin-about-hero",
  widths: [1280, 1920, 2560, 3840],
  fallbackWidth: 1920,
  alt: "A low-poly crowd lit in violet while two red-lit figures rise above them in the dark",
} as const;

const backgroundSrcSet = (format: string) =>
  heroBackground.widths
    .map((width) => `${heroBackground.src}-${width}.${format} ${width}w`)
    .join(", ");

/* The opening intro is a CSS animation (`hero-intro` in editorial.css) rather than a
   JS-driven one: nothing in the markup ships a hidden state, so the headline, the
   intro copy and the buttons stay readable when animations are off, when the visitor
   prefers reduced motion, or when scripts never run. Only the scroll parallax below
   stays in JS, and it only ever moves things. */
export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /* ─── scroll parallax ─── */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <motion.section
      ref={sectionRef}
      id="about"
      className="hero"
      aria-labelledby="hero-heading"
    >
      <motion.div className="hero__content shell" style={{ y: prefersReducedMotion ? 0 : contentY }}>
        <div className="hero__eyebrow">
          <span className="signal-dot signal-dot--hero" aria-hidden="true" />
          Independent game studio · Mobile &amp; PC
        </div>

        <h1 id="hero-heading" className="hero__title">
          <span>Games built</span>
          <span className="hero__outline">to keep <em data-text="moving.">moving.</em></span>
        </h1>
      </motion.div>
      <div className="hero__cinema shell">
        {/* Warps the melt below the headline into flowing, smoke-like streams.
            feTurbulence builds the noise field, the displaced map turns it into liquid
            movement, and animating baseFrequency keeps the flow churning (SMIL, so it
            needs no JavaScript). The region is deliberately huge: the melt reaches far
            past the element's own box. */}
        <svg className="hero__filters" aria-hidden="true" focusable="false" width="0" height="0">
          <filter
            id="hero-melt-warp"
            x="-45%"
            y="-35%"
            width="190%"
            height="520%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="3" seed="6" result="noise">
              <animate
                attributeName="baseFrequency"
                dur="44s"
                calcMode="spline"
                values="0.008 0.016; 0.011 0.013; 0.0065 0.019; 0.0095 0.015; 0.008 0.016"
                keyTimes="0; 0.25; 0.5; 0.75; 1"
                keySplines=".45 0 .55 1; .45 0 .55 1; .45 0 .55 1; .45 0 .55 1"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="20"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <motion.div className="hero__image-wrap" style={{ y: prefersReducedMotion ? 0 : imageY }}>
          <picture>
            <source type="image/avif" srcSet={backgroundSrcSet("avif")} sizes="100vw" />
            <source type="image/webp" srcSet={backgroundSrcSet("webp")} sizes="100vw" />
            <img
              src={`${heroBackground.src}-${heroBackground.fallbackWidth}.jpg`}
              alt={heroBackground.alt}
              className="hero__image"
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
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
        <div className="hero__footer">
          <p className="hero__intro">
            WalkinGames creates focused, replayable experiences with strong
            atmosphere, responsive systems, and worlds that invite one more run.
          </p>
          <div className="hero__actions">
            <a className="button button--solid" href="#games">
              <span>Explore our games</span>
              <span className="button__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m7 5 5 5-5 5" />
                </svg>
              </span>
            </a>
            <a className="text-link" href="#direction">
              <span>See where we&apos;re going</span>
              <span className="text-link__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m7 5 5 5-5 5" />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
