import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JourneyMedia from "@/components/journey/JourneyMedia";
import TimelineMotion from "@/components/journey/TimelineMotion";
import { journeyMedia, milestones } from "@/components/journey/journey-data";
import { journeyOgImageAlt, lastModified, siteName, siteUrl } from "@/lib/site";
import "./journey.css";

const title = "Walkin — From the First Build to Today";
const description = "Follow the development journey of Walkin: six months of building a survivors-like roguelite runner with lane-based movement, one-thumb aiming and zombie combat.";
const route = "/walkin/development-journey";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: route },
  openGraph: { title, description, url: route, type: "article", images: [{ url: `${route}/opengraph-image`, width: 1200, height: 630, alt: journeyOgImageAlt }] },
  twitter: { card: "summary_large_image", title, description, images: [`${route}/opengraph-image`] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: title,
      description,
      url: `${siteUrl}${route}`,
      image: `${siteUrl}${route}/opengraph-image`,
      dateModified: lastModified.journey,
      author: { "@type": "Organization", name: siteName, url: siteUrl },
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Walkin development journey", item: `${siteUrl}${route}` },
      ],
    },
  ],
};

export default function DevelopmentJourneyPage() {
  return (
    <div className="journey-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="journey-nav shell">
        <Link href="/" className="wordmark" aria-label="WalkinGames home"><span className="wordmark__mark" aria-hidden="true">W</span><span>WalkinGames</span></Link>
        <span className="journey-nav__label">Field notes / 001</span>
        <Link href="/#project-walkin" className="text-link">Back to Walkin <span aria-hidden="true">↗</span></Link>
      </header>
      <main id="main">
        <section className="journey-hero shell" aria-labelledby="journey-title">
          <div className="journey-hero__eyebrow"><p className="section-kicker">Walkin / Development journal</p><span>MAR — SEP 2026</span></div>
          <div className="journey-hero__grid">
            <div className="journey-hero__copy">
              <h1 id="journey-title">From the<br />first build<br /><span>to Walkin.</span></h1>
              <p>Six months of building, testing and refining a new kind of mobile runner.</p>
              <a href="#the-journey" className="button button--solid">Follow the journey <span aria-hidden="true">↓</span></a>
            </div>
            <figure className="journey-hero__visual">
              <div className="journey-hero__image"><Image src="/images/walkin-icon.png" alt="Walkin game icon" fill priority sizes="(max-width: 760px) 85vw, 42vw" /></div>
              <figcaption><span>Brooklyn, New York</span><span>Work in progress ↗</span></figcaption>
            </figure>
          </div>
          <div className="journey-hero__footer"><span>One world. Built system by system.</span><a href="#world">Scroll to explore ↓</a></div>
        </section>

        <section id="world" className="journey-world" aria-labelledby="world-title">
          <div className="shell journey-world__grid">
            <div>
              <p className="section-kicker">The last survivors of Brooklyn</p>
              <h2 id="world-title">The road<br />never stops.</h2>
              <p className="journey-lead">Somewhere ahead, the next safe haven is waiting.</p>
              <h3>What is Walkin?</h3>
              <p>A semi-casual survivors-like roguelite runner set in a zombie-infested Brooklyn. Lane-based movement meets rail-shooter aiming: run, aim with one thumb, fight or evade, and build a stronger loadout.</p>
              <p>Each run asks for a different build. Resources and permanent progression give you a reason to come back.</p>
              <div className="journey-world__formula"><span>Keep moving</span><span>Take aim</span><span>Adapt your build</span></div>
            </div>
            <figure><JourneyMedia media={journeyMedia.brooklyn} /><figcaption>Before the run / a moment above the city</figcaption></figure>
          </div>
        </section>

        <section id="the-journey" className="shell journey-chapters" aria-labelledby="chapters-title">
          <header className="journey-chapters__header">
            <div><p className="section-kicker">The development story</p><h2 id="chapters-title">Seven chapters.<br /><span>One continuous run.</span></h2></div>
            <p>A month-by-month account, March–September 2026. Dates describe development phases; the supplied gameplay recordings illustrate the systems, not archived monthly builds.</p>
          </header>
          <nav className="journey-index" aria-label="Jump to development month">{milestones.map((item) => <a key={item.id} href={`#${item.id}`}>{item.month.slice(0, 3)}<span aria-hidden="true"> ↘</span></a>)}</nav>
          <TimelineMotion>
            {milestones.map((item, index) => (
              <li key={item.id} id={item.id} className={`journey-chapter journey-chapter--${item.layout}`} data-milestone>
                <div className="journey-date" data-journey-reveal><a href={`#${item.id}`}><span>0{index + 1} / 2026</span><time dateTime={item.dateTime}>{item.month}</time></a><span className="journey-date__phase">{item.phase}</span></div>
                <span className="journey-dot" aria-hidden="true" />
                <article className="journey-chapter__body" aria-labelledby={`${item.id}-title`}>
                  <div className="journey-chapter__copy" data-journey-reveal>
                    <p className="section-kicker">{item.phase}</p>
                    <h3 id={`${item.id}-title`}>{item.title}</h3>
                    <p className="journey-chapter__intro">{item.body}</p>
                    <p className="journey-chapter__detail">{item.detail}</p>
                    <ul className="journey-tags">{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                  </div>
                  <figure data-journey-reveal>
                    <JourneyMedia media={item.media} still={item.layout === "still"} />
                    <figcaption>{item.caption}</figcaption>
                  </figure>
                  {item.layout === "sequence" && <div className="journey-sequence" aria-label="The connected run loop">{["Run", "Choose", "Continue"].map((step, i) => <div key={step}><span>0{i + 1}</span><strong>{step}</strong><span aria-hidden="true">↗</span></div>)}</div>}
                </article>
              </li>
            ))}
          </TimelineMotion>
        </section>

        <section className="journey-next" aria-labelledby="next-title">
          <div className="shell journey-next__grid">
            <div><p className="section-kicker">Next chapter / Not a release schedule</p><h2 id="next-title">More world.<br /><span>More Walkin.</span></h2></div>
            <div><p className="journey-lead">The foundation is in place. Now it is about depth, variety and the details that make another run worth taking.</p><ul>{["More characters, weapons and build combinations", "A wider cast of enemies, hazards and boss encounters", "Deeper progression, playtesting and iteration"].map((text) => <li key={text}>{text}</li>)}</ul><p className="journey-note">Future direction. No unannounced dates, no promise of finished content.</p></div>
          </div>
        </section>
        <section className="shell journey-outro" aria-labelledby="outro-title"><p className="section-kicker">The story continues</p><h2 id="outro-title">Keep walking.</h2><p>Explore Walkin and the systems behind the game.</p><Link href="/#project-walkin" className="button button--solid">Explore Walkin <span aria-hidden="true">↗</span></Link></section>
      </main>
      <footer className="shell site-footer"><Link href="/">WalkinGames</Link><p>Development journal / March—September 2026</p><div className="site-footer__links"><Link href="/privacy">Privacy</Link><a href="#main">Back to top ↑</a></div></footer>
    </div>
  );
}
