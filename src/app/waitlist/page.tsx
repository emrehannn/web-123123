import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import { lastModified, siteName, siteUrl, waitlistOgImageAlt } from "@/lib/site";
import { waitlistPerks, waitlistRoute } from "@/lib/waitlist";
import "./waitlist.css";

const title = "Walkin Waitlist — Get in line for early access";
const description =
  "Join the Walkin waitlist. One click with a Google account or a single email field, and you are in line for closed test invites, balance surveys and every Walkin update.";
const canonical = waitlistRoute;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: "website",
    images: [{ url: `${canonical}/opengraph-image`, width: 1200, height: 630, alt: waitlistOgImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${canonical}/opengraph-image`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: title,
      description,
      url: `${siteUrl}${canonical}`,
      dateModified: lastModified.waitlist,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@type": "VideoGame", name: "Walkin", url: `${siteUrl}/#project-walkin` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Walkin waitlist", item: `${siteUrl}${canonical}` },
      ],
    },
  ],
};

export default function WaitlistPage() {
  return (
    <div className="waitlist-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="waitlist-nav shell">
        <Link href="/" className="wordmark" aria-label="WalkinGames home">
          <span className="wordmark__mark" aria-hidden="true">W</span>
          <span>WalkinGames</span>
        </Link>
        <span className="waitlist-nav__label">Access queue / 001</span>
        <Link href="/#project-walkin" className="text-link">
          Back to Walkin <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main id="main">
        <section className="waitlist-hero shell" aria-labelledby="waitlist-title">
          <div className="waitlist-hero__eyebrow">
            <p className="section-kicker">Walkin / Waitlist</p>
            <span>Brooklyn, New York</span>
          </div>

          <div className="waitlist-hero__brand">
            <Image
              src="/images/walkin-icon.png"
              alt="Walkin game icon"
              width={512}
              height={512}
              sizes="(max-width: 760px) 168px, (max-width: 1200px) 240px, 300px"
              priority
            />
          </div>

          <h1 id="waitlist-title" className="waitlist-hero__title">
            First<span className="waitlist-hero__accent">in.</span> Walk.
          </h1>

          <div className="waitlist-hero__signup" id="waitlist-form">
            <WaitlistForm />
          </div>

          <p className="waitlist-hero__lead">
            Walkin is in active development. The waitlist is the fastest way in — early access
            invites, balance surveys, and every build update, sent to one inbox and nothing else.
          </p>

          <div className="waitlist-hero__actions">
            <Link href="/walkin/development-journey" className="text-link">
              <span>How it got here</span>
              <span className="text-link__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 15 15 5M8 5h7v7" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="waitlist-hero__share">
            <span>Share this link — it opens straight into the form.</span>
            <a href="mailto:?subject=Walkin%20waitlist&body=I%20signed%20up%20for%20Walkin%3A%20https%3A%2F%2Fwalkingames.com%2Fwaitlist">
              walkingames.com/waitlist ↗
            </a>
          </div>
        </section>

        <section className="waitlist-perks" aria-labelledby="waitlist-perks-title">
          <div className="shell">
            <div className="waitlist-perks__header">
              <div>
                <p className="section-kicker">What the list gets you</p>
                <h2 id="waitlist-perks-title">
                  No noise.<br />
                  <span>Just the game.</span>
                </h2>
              </div>
              <figure className="waitlist-poster">
                <div>
                  <Image
                    src="/images/walkin-icon.png"
                    alt="Walkin game icon"
                    fill
                    sizes="(max-width: 1000px) 100vw, 32vw"
                  />
                </div>
                <figcaption>
                  <span>Walkin</span>
                  <span>In development</span>
                </figcaption>
              </figure>
            </div>

            <div className="waitlist-perks__grid">
              {waitlistPerks.map((perk) => (
                <article key={perk.index} className="waitlist-perk">
                  <span>{perk.index}</span>
                  <h3>{perk.title}</h3>
                  <p>{perk.body}</p>
                </article>
              ))}
            </div>

            <p className="waitlist-note">
              Signups land in our studio inbox so we can send to them directly. One message per
              real update, and an unsubscribe link in every single one.
            </p>
          </div>
        </section>

        <section className="waitlist-outro shell" aria-labelledby="waitlist-outro-title">
          <p className="section-kicker">Still deciding?</p>
          <h2 id="waitlist-outro-title">
            See the<br />
            <span>game first.</span>
          </h2>
          <p>
            Read how Walkin was built from the first prototype to today, or explore the rest of
            the studio.
          </p>
          <div className="waitlist-hero__actions">
            <Link href="/walkin/development-journey" className="button button--solid">
              <span>Development journey</span>
              <span className="button__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 15 15 5M8 5h7v7" />
                </svg>
              </span>
            </Link>
            <Link href="/" className="text-link">
              <span>Back to WalkinGames</span>
              <span className="text-link__icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="m7 5 5 5-5 5" />
                </svg>
              </span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="shell site-footer">
        <Link href="/">WalkinGames</Link>
        <p>Walkin waitlist / {siteName}</p>
        <div className="site-footer__links">
          <Link href="/privacy">Privacy</Link>
          <a href="#main">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}