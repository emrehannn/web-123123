"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

const SOCIAL_LINKS = [
  { id: "x", label: "X", href: "https://x.com/walkin_games" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/walkingames" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@walkingames-01" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@walkin.games" },
] as const;

const SOCIAL_GLYPHS: Record<string, ReactNode> = {
  x: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-5.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  instagram: (
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  ),
  youtube: (
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  ),
  tiktok: (
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  ),
};

function SocialGlyph({ id }: { id: (typeof SOCIAL_LINKS)[number]["id"] }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{SOCIAL_GLYPHS[id]}</svg>;
}

const NAV_ITEMS: { label: string; href: string; mega?: { title: string; image: string; imageAlt: string; href: string }[] }[] = [
  { label: "Studio", href: "#studio" },
  {
    label: "Games",
    href: "#games",
    mega: [
      { title: "Walkin", image: "/images/walkin-wallpaper.png", imageAlt: "Walkin key art", href: "#project-walkin" },
      { title: "Duskfall Requiem", image: "/images/DuskfallRequiem.png", imageAlt: "Duskfall Requiem key art", href: "#project-duskfall-requiem" },
    ],
  },
  { label: "Direction", href: "#direction" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const programmaticScrollUntilRef = useRef(0);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 24);

      const marker = scrollY + 120;
      let current = "";
      for (const { href } of NAV_ITEMS) {
        const id = href.slice(1);
        const section = document.getElementById(id);
        const sectionTop = section
          ? section.getBoundingClientRect().top + scrollY
          : Number.POSITIVE_INFINITY;
        if (sectionTop <= marker) {
          current = id;
        }
      }
      // The final section can be shorter than the viewport, so its top may
      // never cross the fixed-header marker even after reaching the page end.
      if (scrollY > 0 && scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = NAV_ITEMS[NAV_ITEMS.length - 1].href.slice(1);
      }
      setActiveSection(current);

      // Smart hide/show — keep the site visible at the top and while a nav
      // click is still settling; hide only on sustained downward scroll
      // (slow reading scrolls stay visible), reveal on any upward scroll.
      const settling = Date.now() < programmaticScrollUntilRef.current;
      const navigationHasFocus = document.activeElement?.closest(".site-header") !== null;
      if (settling || scrollY <= 24 || navigationHasFocus) {
        setHidden(false);
      } else if (scrollY < lastScrollYRef.current) {
        setHidden(false);
      } else if (scrollY > lastScrollYRef.current + 4) {
        setHidden(true);
        // Close any open mega menu when the navbar auto-hides — the panel
        // hangs below the pill and would otherwise stay on screen like a ghost.
        setMegaOpen(false);
      }
      lastScrollYRef.current = scrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => menuToggleRef.current?.focus());
    }
  }, []);

  const navigateTo = useCallback((event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;

    // Keep the navbar visible while the smooth scroll is in flight;
    // otherwise the auto-hide would swallow it mid-animation.
    programmaticScrollUntilRef.current = Date.now() + 1200;
    setHidden(false);

    // SectionTransition owns relocation after the curtain fully covers the
    // viewport. Leave this event uncancelled so its document listener runs.
    setActiveSection(href.slice(1));
    setMegaOpen(false);
    closeMenu();
  }, [closeMenu]);

  useEffect(() => {
    if (!menuOpen && !megaOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMegaOpen(false);
        if (menuOpen) closeMenu(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu, menuOpen, megaOpen]);

  return (
    <>
      <header
        className={`site-header ${scrolled ? "site-header--scrolled" : ""} ${
          hidden && !menuOpen ? "site-header--hidden" : ""
        }`}
        onFocusCapture={() => setHidden(false)}
      >
        <nav className="site-nav shell" aria-label="Main navigation">
          <a href="#about" className="wordmark" aria-label="WalkinGames - Back to top">
            <span className="wordmark__mark" aria-hidden="true">W</span>
            <span className="wordmark__label">Walkin<span>Games</span></span>
          </a>

          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li
                key={item.href}
                className={item.mega ? "nav-links__item--mega" : undefined}
                onMouseEnter={() => { if (item.mega) setMegaOpen(true); }}
                onMouseLeave={() => { if (item.mega) setMegaOpen(false); }}
                onBlur={(event) => {
                  if (item.mega && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setMegaOpen(false);
                  }
                }}
              >
                <a
                  href={item.href}
                  onClick={(event) => navigateTo(event, item.href)}
                  className={`nav-link ${activeSection === item.href.slice(1) ? "nav-link--active" : ""}`}
                  aria-current={activeSection === item.href.slice(1) ? "location" : undefined}
                  onFocus={() => { if (item.mega) setMegaOpen(true); }}
                >
                  {item.label}
                </a>
                {item.mega && item.label === "Games" && (
                  <div
                    className={`nav-mega ${megaOpen ? "nav-mega--open" : ""}`}
                    aria-hidden={!megaOpen}
                  >
                    {item.mega.map((game) => (
                      <a
                        key={game.title}
                        href={game.href}
                        className="nav-mega__card"
                        onClick={(e) => navigateTo(e, game.href)}
                      >
                        <span className="nav-mega__thumb">
                          <Image src={game.image} alt={game.imageAlt} fill sizes="120px" className="nav-mega__img" />
                        </span>
                        <span className="nav-mega__label">{game.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <ul className="nav-social">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.id}>
                  <a
                    className="nav-social__link"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} — opens in a new tab`}
                  >
                    <SocialGlyph id={social.id} />
                  </a>
                </li>
              ))}
            </ul>
            <a className="nav-contact" href="mailto:hello@walkingames.com" aria-label="Let's talk">
              <span className="nav-contact__label">Let&apos;s talk</span>
              <span className="nav-contact__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 15 15 5M8 5h7v7" />
                </svg>
              </span>
            </a>
            <button
              type="button"
              className="menu-toggle"
              ref={menuToggleRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <span />
              <span />
            </button>
          </div>
        </nav>

        <div
          id="mobile-navigation"
          className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}
          aria-hidden={!menuOpen}
          inert={!menuOpen ? true : undefined}
        >
          <ul>
            {NAV_ITEMS.map((item, index) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={activeSection === item.href.slice(1) ? "is-active" : ""}
                  onClick={(event) => navigateTo(event, item.href)}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <span>0{index + 1}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="mobile-menu__mail" href="mailto:hello@walkingames.com" tabIndex={menuOpen ? 0 : -1}>
            hello@walkingames.com {"\u2197\uFE0E"}
          </a>
          <ul className="mobile-menu__social" aria-label="Social media">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.id}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.label} — opens in a new tab`}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <SocialGlyph id={social.id} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>
      {megaOpen && <div className="nav-mega-blur" aria-hidden="true" />}
    </>
  );
}