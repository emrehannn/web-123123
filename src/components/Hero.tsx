"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
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

/* ─── dither veil ───
   The artwork behind the headline gets its own WebGL pass: a two-tone halftone that the
   brush prints onto the photograph and that fades back out behind it. Four deliberate
   limits:

     · it is loaded as its own client chunk, so ogl never touches the critical path;
     · it never runs for a reduce-motion visitor;
     · it never runs for a touch pointer — a phone has no hover and no fine cursor, so
       it would only ever be stuck in the idle state;
     · it reads the AVIF the browser has already chosen from the <picture> below,
       which makes the texture a cache hit rather than a second download.

   It also mounts a tick after the first paint, so the plain <img> above stays both the
   LCP element and the thing that is left if any of the above says no. */
const DitherVeil = dynamic(() => import("./DitherVeil"), { ssr: false });

const veilImage = `${heroBackground.src}-${heroBackground.fallbackWidth}.avif`;

/* The conditions the veil needs from the visitor: a mouse, permission to move, and a
   window wide enough that the hero is still the desktop layout. Below 760px the
   stylesheet reframes the <img> (`object-position: 48%`) and the `alignX` the canvas
   copies from the desktop rule stops matching it, so the print would land offset.
   All three are read through `useSyncExternalStore` rather than an effect, because the
   answer has to be `false` for the server render *and* for the hydration pass — mounting
   the canvas any earlier tears the whole tree down over a mismatch. Module scope keeps
   the functions stable, and it means the veil also follows a resize or a settings change
   live. */
const VEIL_MEDIA = [
  "(prefers-reduced-motion: no-preference)",
  "(hover: hover) and (pointer: fine)",
  "(min-width: 760px)",
] as const;
const readVeilMedia = () => VEIL_MEDIA.map((query) => window.matchMedia(query));
const subscribeVeilMedia = (onChange: () => void) => {
  const queries = readVeilMedia();
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
};
const veilAllowed = () => readVeilMedia().every((query) => query.matches);
const veilUnavailable = () => false;

/* The opening intro is a CSS animation (`hero-intro` in editorial.css) rather than a
   JS-driven one: nothing in the markup ships a hidden state, so the headline, the
   intro copy and the buttons stay readable when animations are off, when the visitor
   prefers reduced motion, or when scripts never run. Only the scroll parallax below
   stays in JS, and it only ever moves things. */
export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /* The veil mounts a tick after hydration at the earliest, so the plain <img> below
     stays both the LCP element and the thing that is left if either condition says no. */
  const showVeil = useSyncExternalStore(subscribeVeilMedia, veilAllowed, veilUnavailable);

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
          {/* The veil sits on top of the artwork it dithers, inside the same parallax
              wrapper, so both layers travel together as one image.

              `reverse` is the whole idea: the hero opens as the photograph it always
              was, and the halftone is what the brush *lays down* on it — a 1px bayer
              screen of near-black ink and amber paper that fades out four seconds later.
              Turning `reverse` off flips it into a poster that the brush wipes clean.

              Nobody steers it. The canvas sits behind the hero's own content, so a
              cursor can only reach the slivers of it the headline, the badge and the
              buttons do not cover, which makes a pointer-driven effect read as broken
              rather than interactive. So the veil drives itself: `wander` walks the brush
              along a slow lissajous of its own, and a pointer that does land on it still
              takes over from there.

              Where it walks is fitted to this artwork rather than to the frame: 86% of
              the crop is black sky, where ink shows as nothing. `wanderCenter` is the
              crowd along the bottom edge — the one broad lit band — and `wanderSpeed`
              0.35 sweeps the brush the full width of it in about 34 seconds. `wanderRise`
              adds the dancers to the round: whenever that sweep passes under their column
              the brush climbs the 0.55 of the frame `wanderSpan` asks for, prints them for
              a few seconds and comes back down to the crowd, which keeps the rest.

              Two deliberate departures from the ReactBits preset:

                · `printFloor` — the print is ink on paper, and this artwork is mostly
                  pure black: measured, only 13% of the crop has any luminance at all.
                  Ink marked onto that nothing reads as dirt drifting over the sky
                  instead of as print, so the veil lets the print land only where the
                  picture is actually lit — the crowd, the two figures, the beam — and
                  dissolves it out again towards the darks.
                · the grading — the reference values assume a daylight photo, so they
                  crush a night scene this dark into flat ink: simulated over the crop,
                  they print only 4% of the lit area in amber, which is no effect at all.
                  These values print about 39%, a halftone that reads as the picture.

              `fit` is `cover` because this is a full-bleed backdrop, not a plate on
              paper. `alignX` repeats the `object-position` the stylesheet gives the <img>
              underneath, so the two frame the composition identically and nothing shifts
              when the canvas fades in over it. */}
          {showVeil ? (
            <DitherVeil
              className="hero__veil"
              src={veilImage}
              fit="cover"
              pattern="bayer"
              pixelSize={1}
              levels={2}
              palette="duotone"
              alignX={0.65}
              inkColor="#120f17"
              paperColor="#eab308"
              revealRadius={130}
              softness={0.3}
              linger={4}
              rimColor="#4700ff"
              rim={0}
              contrast={1.3}
              brightness={0.5}
              printFloor={0.01}
              reverse
              wander
              wanderCenter={[0.46, 0.92]}
              wanderSpan={[0.42, 0.55]}
              wanderRise={[0.6, 0.16]}
              wanderSpeed={0.35}
              clickBurst
            />
          ) : null}
        </motion.div>
        {/* The gentle darkening pass over the artwork: a third of black at the bottom
            edge, thinning upward and gone by two thirds, so the picture settles into the
            page without the halftone over the crowd losing its brightness. It needs no
            radius of its own — it only paints, and the plate below already clips the
            picture at its bottom corners. */}
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
