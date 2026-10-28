import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { lastModified, ogImageAlt, siteName, siteUrl } from "@/lib/site";
import "./privacy.css";

/* ─── Values only the controller can supply ──────────────────────────────────────
   Everything the founders fill in lives in POLICY. The values are final text; the
   `Value` component still renders a highlighted "[TO FILL: …]" marker for anything
   left as `{ toFill }`, so an unfinished value can never ship silently. */
type Fillable = string | { toFill: string };

const POLICY = {
  effectiveDate: "28 October 2026",
  controller: "Emrehan Dalaman",
  tradingName: "Walkin Games",
  postalAddress: "54292 Trier, Germany",
  phone: "+49 15510871276",
  email: "support@walkingames.com",
  policyUrl: "https://walkingames.com/privacy",
  taxRetention: "10 years (section 147 of the German Fiscal Code)",
  authority: {
    name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz (LfDI Rheinland-Pfalz)",
    address: "Hintere Bleiche 34, 55116 Mainz, Germany",
    url: "https://www.datenschutz.rlp.de",
  },
} as const;

const route = "/privacy";
const title = "Privacy Policy — Walkin and WalkinGames";
const description =
  "How the game Walkin and walkingames.com handle your data: what is collected, why, who receives it, how long it is kept, children's privacy, and your rights and choices.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: route },
  openGraph: {
    title,
    description,
    url: route,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: ogImageAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: title,
      description,
      url: `${siteUrl}${route}`,
      dateModified: lastModified.privacy,
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Privacy policy", item: `${siteUrl}${route}` },
      ],
    },
  ],
};

const SECTIONS = [
  { id: "who-we-are", title: "Who we are" },
  { id: "short-version", title: "The short version" },
  { id: "what-we-collect", title: "What we collect, why, and on what legal basis" },
  { id: "children", title: "Children" },
  { id: "your-choices", title: "Your choices" },
  { id: "retention", title: "How long we keep data" },
  { id: "recipients", title: "Who receives data" },
  { id: "transfers", title: "International transfers" },
  { id: "your-rights", title: "Your rights" },
  { id: "deleting", title: "Deleting your data" },
  { id: "security", title: "Security" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
] as const;

function Value({ v }: { v: Fillable }) {
  if (typeof v === "string") return <>{v}</>;
  return <mark className="privacy-fill">[TO FILL: {v.toFill}]</mark>;
}

function Section({ n, children }: { n: number; children: ReactNode }) {
  const { id, title: sectionTitle } = SECTIONS[n - 1];
  return (
    <section id={id} className="privacy-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>
        <span className="privacy-num">{String(n).padStart(2, "0")}</span>
        <span>{sectionTitle}</span>
      </h2>
      {children}
    </section>
  );
}

function Sub({ id, children }: { id: string; children: ReactNode }) {
  return <h3 id={id}>{children}</h3>;
}

/** A labelled list of facts — What / Why / Legal basis / Who / Kept. */
function Facts({ items, wide = false }: { items: [string, ReactNode][]; wide?: boolean }) {
  return (
    <dl className={`privacy-facts${wide ? " privacy-facts--wide" : ""}`}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A table that becomes a stack of labelled cards on narrow screens. */
function Table({ head, rows, label }: { head: string[]; rows: ReactNode[][]; label: string }) {
  return (
    <div className="privacy-table">
      <table role="table" aria-label={label}>
        <thead role="rowgroup">
          <tr role="row">
            {head.map((cell) => (
              <th key={cell} scope="col" role="columnheader">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row, r) => (
            <tr key={r} role="row">
              {row.map((cell, c) => (
                <td key={c} role="cell" data-label={head[c]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Mail = ({ to = POLICY.email }: { to?: string }) => <a href={`mailto:${to}`}>{to}</a>;
const Ref = ({ to, children }: { to: string; children: ReactNode }) => <a href={`#${to}`}>{children}</a>;
const Ext = ({ href, children }: { href: string; children?: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children ?? href.replace(/^https:\/\//, "")}
  </a>
);

const controllerLine = (
  <>
    {POLICY.controller}, trading as {POLICY.tradingName}
  </>
);

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="privacy-nav shell">
        <Link href="/" className="wordmark" aria-label="WalkinGames home">
          <span className="wordmark__mark" aria-hidden="true">W</span>
          <span>WalkinGames</span>
        </Link>
        <span className="privacy-nav__label">Legal / Privacy</span>
        <Link href="/" className="text-link">
          Back to WalkinGames <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main id="main">
        <section className="privacy-hero shell" aria-labelledby="privacy-title">
          <div className="privacy-hero__eyebrow">
            <p className="section-kicker">Walkin / Privacy policy</p>
            <span>
              Effective <Value v={POLICY.effectiveDate} />
            </span>
          </div>
          <h1 id="privacy-title">
            Privacy
            <br />
            <span>policy.</span>
          </h1>
          <p className="privacy-hero__lead">
            What the game Walkin and this website collect, why, who receives it, how long it is kept,
            and how to change your mind.
          </p>
          <dl className="privacy-meta">
            <div>
              <dt>Effective date</dt>
              <dd>
                <Value v={POLICY.effectiveDate} />
              </dd>
            </div>
            <div>
              <dt>Applies to</dt>
              <dd>The game Walkin on Android and iOS, and walkingames.com</dd>
            </div>
            <div>
              <dt>Policy address</dt>
              <dd>
                <a href={POLICY.policyUrl}>{POLICY.policyUrl.replace(/^https:\/\//, "")}</a>
              </dd>
            </div>
            <div>
              <dt>Questions</dt>
              <dd>
                <Mail />
              </dd>
            </div>
          </dl>
        </section>

        <div className="privacy-sheet">
          <div className="shell privacy-layout">
            <nav className="privacy-toc" aria-label="Contents">
              <p className="section-kicker">Contents</p>
              <ol>
                {SECTIONS.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className="privacy-doc">
              <Section n={1}>
                <p>
                  Walkin is made by {POLICY.tradingName}, a small independent studio.{" "}
                  {POLICY.controller}, trading as {POLICY.tradingName}, decides what data the game and
                  this website use and why, so for privacy law he is the <strong>controller</strong>.
                  In this policy, “we” and “us” mean {POLICY.tradingName}.
                </p>
                <Facts
                  wide
                  items={[
                    ["Controller", controllerLine],
                    ["Postal address", POLICY.postalAddress],
                    ["Phone", <a key="phone" href={`tel:${POLICY.phone.replace(/\s/g, "")}`}>{POLICY.phone}</a>],
                    ["Email for every privacy question", <strong key="email"><Mail /></strong>],
                    ["Website", "walkingames.com"],
                  ]}
                />
                <p>
                  Write to <Mail /> for anything in this policy.
                </p>
              </Section>

              <Section n={2}>
                <ul>
                  <li>
                    <strong>No account, no name, no email, no location permission, no chat.</strong> You
                    never type personal details into Walkin. Your progress is saved on your phone.
                  </li>
                  <li>
                    <strong>We ask your age once</strong>, with a month-and-year screen. We keep only an
                    age band on your phone — never your birth date.
                  </li>
                  <li>
                    <strong>If you are old enough to consent where you live, you choose.</strong> You get
                    two unticked choices: <em>personalised ads</em> and <em>analytics</em>.{" "}
                    <em>Accept all</em> and <em>Confirm my choices</em> are both fine; the game works the
                    same either way. You can change your mind in{" "}
                    <strong>Settings → Privacy choices</strong>.
                  </li>
                  <li>
                    <strong>Younger players are never asked.</strong> Below your country’s age of digital
                    consent (13 in the US, the UK and most other countries; 13 to 16 in the EU; 16 in
                    Germany) you get the game’s <strong>child path</strong>: no personalised ads, no
                    advertising ID, child-safe ad networks only, and no analytics leaves your phone.
                  </li>
                  <li>
                    <strong>Some things happen for everyone:</strong> ads are shown (non-personalised
                    unless you said yes), and if the game crashes, a crash report is sent so we can fix
                    it. Outside the child path, our ad mediation is also told your career level and
                    purchase totals, to decide which ads to request and how often (
                    <Ref to="ad-segment">3.5</Ref>).
                  </li>
                  <li>
                    <strong>Delete my data</strong> in Settings asks Unity to delete the analytics data
                    about you.
                  </li>
                  <li>
                    <strong>Our website has no analytics, no ads and no cookies.</strong> If you join the
                    Walkin waitlist, we keep the email address you give us so we can write to you about
                    the game.
                  </li>
                  <li>
                    We do <strong>not</strong> sell your personal data.
                  </li>
                </ul>
              </Section>

              <Section n={3}>
                <p>
                  The legal bases below are those of the EU and UK GDPR: <strong>consent</strong> (Art.
                  6(1)(a)), <strong>contract</strong> — providing the game and what you bought (Art.
                  6(1)(b)), <strong>legal obligation</strong> (Art. 6(1)(c)) and{" "}
                  <strong>legitimate interests</strong> (Art. 6(1)(f)).
                </p>

                <Sub id="on-your-phone">3.1 On your phone only — never sent to us</Sub>
                <Table
                  label="Data kept only on your phone"
                  head={["What", "Why", "Kept"]}
                  rows={[
                    [
                      "Your save: progress, currencies, items, settings, the profile picture you picked",
                      "to run the game",
                      "until you uninstall or clear the app’s data",
                    ],
                    [
                      "Your age band (child / teen / adult), your privacy choices",
                      "to apply the right privacy path every launch",
                      "until you uninstall or clear the app’s data",
                    ],
                    [
                      "A technical event log (what happened in the game, device model, frame rate)",
                      "so we can debug the game on our own test phones",
                      "7 days, at most 20 MB, then deleted automatically",
                    ],
                    [
                      "The weekly leaderboard",
                      "it is computed on your phone; your scores are not uploaded",
                      "until the week ends",
                    ],
                    [
                      "Reminder notifications",
                      "scheduled on your phone; nothing is sent to a server",
                      "until shown or cancelled",
                    ],
                  ]}
                />
                <p>
                  This data is not “collected” by us: it does not leave your device unless you share it
                  yourself.
                </p>
                <p>
                  <strong>Android Auto Backup.</strong> Android may back up the save file and settings to{" "}
                  <em>your</em> Google account, so a reinstall restores your progress. Google stores that
                  backup; we cannot read it. You can turn backup off in Android’s settings.
                </p>

                <Sub id="age-screen">3.2 The age screen</Sub>
                <p>
                  At first launch, before any ad or analytics code starts, the game asks for your{" "}
                  <strong>month and year of birth</strong>, with nothing pre-filled. It works out how old
                  you are, compares that with the <strong>age of digital consent</strong> of the country
                  your phone’s region is set to (13 to 16 in the EU, 16 in Germany, 13 in the UK and the
                  US; 16 if the region cannot be read), and stores only one of three bands:
                </p>
                <Table
                  label="Age bands"
                  head={["Band", "Who", "Path"]}
                  rows={[
                    [
                      "Child",
                      "below that age",
                      <>
                        the <strong>child path</strong> (<Ref to="children">section 4</Ref>) — no consent
                        questions
                      </>,
                    ],
                    ["Teen", "at or above that age, under 18", "the consent choices; never Apple’s tracking prompt"],
                    ["Adult", "18 or older", "the consent choices"],
                  ]}
                />
                <p>The birth date is forgotten straight away. The screen is asked once per install.</p>
                <Facts
                  items={[
                    [
                      "Legal basis",
                      "Legal obligation and legitimate interest — we must treat children differently, and we can only do that if we know who is a child (Art. 6(1)(c), (f)).",
                    ],
                  ]}
                />

                <Sub id="analytics">3.3 Analytics — Unity Gaming Services Analytics (only if you say yes)</Sub>
                <p>
                  <strong>
                    Only if you are old enough to consent (band teen or adult) and you ticked analytics.
                  </strong>{" "}
                  Nothing is sent before you answer, nothing after you say no, and nothing ever on the
                  child path.
                </p>
                <Facts
                  items={[
                    [
                      "What",
                      <>
                        How you play — sessions, runs, stages, cards picked, items earned and spent, ads
                        watched, purchases (product, list price, the store’s transaction ID), menus opened,
                        load times and frame rate, device model, operating system, memory size, the install
                        source (see <Ref to="install-referrer">3.7</Ref>), your age band. Unity adds your{" "}
                        <strong>IP address</strong> (used to derive your country), a random{" "}
                        <strong>installation ID</strong>, a user ID that equals the installation ID, and on
                        iOS the <strong>IDFV</strong> (an ID for our apps on your device). We never send
                        anything you typed.
                      </>,
                    ],
                    [
                      "Why",
                      "To see where players get stuck, what is too hard or too easy, whether the game crashes on some phones, and whether it earns enough to keep going.",
                    ],
                    [
                      "Legal basis",
                      "Your consent (Art. 6(1)(a) GDPR; § 25(1) TDDDG, Germany’s rule on storing and reading information on your device, for reading and storing the ID on your device).",
                    ],
                    [
                      "Who",
                      <>
                        Unity Technologies processes it for us as our <strong>processor</strong>.
                      </>,
                    ],
                    [
                      "Kept",
                      "13 months, then Unity deletes it. Summary numbers that no longer identify anyone (for example “daily players”) may be kept longer.",
                    ],
                  ]}
                />

                <Sub id="crash-reports">3.4 Crash reports — Unity Diagnostics (everyone)</Sub>
                <Facts
                  items={[
                    [
                      "What",
                      <>
                        When the game crashes, freezes (Android “app not responding”) or throws an error:
                        the error and where in the code it happened, recent game log lines, device model,
                        operating system, memory, the game version, and the random{" "}
                        <strong>installation ID</strong>.
                      </>,
                    ],
                    ["Why", "To find and fix crashes. A game that crashes is a broken product."],
                    [
                      "Legal basis",
                      <>
                        Legitimate interest in a working, secure game (Art. 6(1)(f)). The data is minimal
                        and is not used for anything else. You can <strong>object</strong> — see{" "}
                        <Ref to="your-rights">section 9</Ref>.
                      </>,
                    ],
                    [
                      "Children (US law)",
                      "This is “support for the internal operations” of the game, which COPPA allows without parental consent as long as nothing else is collected and it is used for nothing else.",
                    ],
                    ["Who", "Unity Technologies, as our processor."],
                    ["Kept", "90 days, then Unity deletes it."],
                  ]}
                />

                <Sub id="advertising">3.5 Advertising — Unity LevelPlay, with ironSource Ads, Unity Ads and Google AdMob</Sub>
                <p>
                  Walkin is free and paid for by ads (watch-for-reward ads and occasional full-screen ads;
                  any purchase switches the full-screen ads off). <strong>Unity LevelPlay</strong>, the ad
                  mediation run by Unity and its affiliate ironSource, picks which ad network shows each
                  ad: <strong>ironSource Ads</strong> (the ironSource exchange),{" "}
                  <strong>Unity Ads</strong> or <strong>Google AdMob</strong>. No other ad network is
                  used; in particular, Walkin does not use AppLovin. The ad networks receive data{" "}
                  <strong>directly from the ad code in the game</strong> and use it as independent
                  controllers under their own privacy policies (links in{" "}
                  <Ref to="recipients">section 7</Ref>).
                </p>
                <p>
                  What every network receives to deliver any ad, personalised or not: your{" "}
                  <strong>IP address</strong> (rough location, for example the country), device and app
                  details (make, model, operating system, language, the app’s name and version), an
                  installation-scoped identifier, and what you do with the ad (seen, tapped, closed,
                  reward earned).
                </p>
                <Table
                  label="What the ad networks are told on each privacy path"
                  head={["Your path", "What the networks are told", "Networks used"]}
                  rows={[
                    [
                      "Old enough to consent, said yes to personalised ads",
                      <>
                        Consent given. They may also use your phone’s <strong>advertising ID</strong>{" "}
                        (AAID on Android; on iOS the IDFA only if you allow tracking in Apple’s prompt,
                        which we show only to players 18 or older who said yes) to show ads based on your
                        activity in other apps.
                      </>,
                      "ironSource Ads, Unity Ads, AdMob",
                    ],
                    [
                      "Old enough to consent, said no",
                      <>
                        No consent, and “do not sell or share” (the US opt-out signal): ads are{" "}
                        <strong>not personalised</strong>. The networks may still receive the advertising
                        ID for frequency capping and fraud prevention.
                      </>,
                      "ironSource Ads, Unity Ads, AdMob",
                    ],
                    [
                      <>
                        <strong>Child path</strong> — below your country’s age of digital consent, and
                        anyone before the age screen is answered
                      </>,
                      <>
                        <strong>Child-directed:</strong> no advertising ID is read or sent, only contextual
                        ads (based on the game, not on you), only ad networks in Google Play’s Families
                        Self-Certified Ads SDK program, ads rated G at most; AdMob is also told you are
                        under the age of consent.
                      </>,
                      "ironSource Ads, Unity Ads, AdMob",
                    ],
                  ]}
                />
                <Facts
                  items={[
                    ["Why", "To show ads that pay for the game, cap how often you see the same ad, and stop ad fraud."],
                    [
                      "Legal basis",
                      <>
                        Personalised ads — your consent (Art. 6(1)(a); § 25(1) TDDDG). Non-personalised
                        and contextual ads — our legitimate interest in funding a free game (Art.
                        6(1)(f)). You can <strong>object</strong> — <Ref to="your-rights">section 9</Ref>.
                      </>,
                    ],
                    [
                      "Children (US law)",
                      "Contextual ads and frequency capping are “support for the internal operations” of the game under COPPA; behavioural advertising is not, and we do not allow it for children.",
                    ],
                    [
                      "Kept",
                      "By each network under its own policy — for example Unity keeps ad interaction data tied to an installation ID for up to 12 months; Google removes part of the IP address from advertising logs after 9 months.",
                    ],
                  ]}
                />
                <p id="ad-segment">
                  <strong>Your player segment — sent to Unity LevelPlay.</strong> So that LevelPlay can
                  treat groups of players differently (which ad networks to ask, and how often to show
                  full-screen ads), the game tells it which group you are in. It sends this when the ad
                  code starts, and again before an ad loads whenever one of the values has changed.
                </p>
                <Facts
                  items={[
                    [
                      "What",
                      "Your career level in the game, whether you have ever paid for something in it (a restored purchase counts), your lifetime spend in the game (the list price of your purchases, in US dollars), the date you installed the game, and your age band (teen or adult).",
                    ],
                    [
                      "Whose",
                      "Every player outside the child path, including players who said no to personalised ads.",
                    ],
                    [
                      "Child path",
                      "Only the age band (“child”) is sent, so children’s ad requests can be handled separately. No level, purchase or install data is sent.",
                    ],
                    ["Why", "Ad mediation and frequency decisions: which ad networks to ask, and how often to show full-screen ads."],
                    [
                      "Legal basis",
                      <>
                        Our legitimate interest in funding a free game with ads (Art. 6(1)(f)), as for
                        non-personalised ads. You can <strong>object</strong> —{" "}
                        <Ref to="your-rights">section 9</Ref>.
                      </>,
                    ],
                  ]}
                />
                <p>
                  We receive from the networks only <strong>aggregated reports</strong> and, per ad shown,
                  technical details (the network’s name, the ad format, an auction ID and the estimated
                  revenue) — not who you are.
                </p>

                <Sub id="purchases">3.6 In-app purchases — Google Play and the App Store (via Unity IAP)</Sub>
                <ul>
                  <li>
                    Payment happens <strong>inside Google Play or the App Store</strong>. We never see your
                    card or bank details. Google and Apple handle the payment under their own privacy
                    policies.
                  </li>
                  <li>
                    The game receives a receipt (order number, product, time) on your phone, checks it
                    there, and gives you what you bought. If you said yes to analytics, the purchase is
                    also part of <Ref to="analytics">3.3</Ref>.
                  </li>
                  <li>
                    In the Play Console and App Store Connect we can see order records (order number,
                    product, price, date, refund status) and use them to answer support requests, handle
                    refunds and keep our accounts.
                  </li>
                  <li>Crates in Walkin give random items. Their odds are shown in the game before you open one.</li>
                </ul>
                <Facts
                  items={[
                    [
                      "Legal basis",
                      "Contract (Art. 6(1)(b)); keeping accounting records is a legal obligation (Art. 6(1)(c)).",
                    ],
                    [
                      "Kept",
                      <>
                        The stores keep their records; we keep exported order data only as long as tax law
                        requires: <Value v={POLICY.taxRetention} />.
                      </>,
                    ],
                  ]}
                />

                <Sub id="install-referrer">3.7 Where you installed from — Google Play Install Referrer (Android)</Sub>
                <p>
                  On the first start, the game asks Google Play which link you came from (for example a
                  campaign tag such as <code>utm_source=tiktok</code>) and whether the game was installed
                  from Google Play. This stays on your phone unless you said yes to analytics, in which
                  case it is part of <Ref to="analytics">3.3</Ref>. It tells us which posts and campaigns
                  bring players.
                </p>

                <Sub id="notifications">3.8 Notifications</Sub>
                <p>
                  Reminders (for example “your daily reward is ready”) are scheduled{" "}
                  <strong>on your phone</strong>. On Android 13 and later the system asks your permission
                  first. No push service is used and nothing is sent to a server. If you said yes to
                  analytics, whether a reminder was shown or opened is part of{" "}
                  <Ref to="analytics">3.3</Ref>. Turn reminders off in the game’s Settings or in your
                  phone’s settings.
                </p>

                <Sub id="email-us">3.9 When you email us</Sub>
                <p>
                  If you write to <Mail /> we get your email address and what you write.
                </p>
                <Facts
                  items={[
                    ["Legal basis", "Contract or legitimate interest in answering (Art. 6(1)(b), (f))."],
                    ["Kept", "12 months after the conversation ends."],
                  ]}
                />
                <p>
                  <strong>If a child writes to us, we answer once and then delete the email</strong>{" "}
                  (COPPA § 312.5(c)(3)).
                </p>

                <Sub id="website">3.10 Our website</Sub>
                <p>
                  walkingames.com has no analytics, no advertising and no tracking scripts, sets no
                  cookies, and serves its fonts, images and videos from its own domain. The links to our
                  pages on X, Instagram, YouTube and TikTok are ordinary links: nothing loads from those
                  services unless you click one.
                </p>
                <p>
                  <strong>Hosting — every visitor.</strong> The site is hosted by Vercel. To deliver each
                  page, Vercel’s servers receive your IP address and the details your browser sends with
                  every request (the page address, the time, your browser type), and record requests in
                  short-lived logs.
                </p>
                <Facts
                  items={[
                    ["Why", "To deliver the site, keep it working and fix errors."],
                    ["Legal basis", "Legitimate interest in running a working, secure website (Art. 6(1)(f))."],
                    ["Who", "Vercel Inc. (USA), as our processor."],
                    ["Kept", "One hour to one day, depending on the hosting plan."],
                  ]}
                />
                <p>
                  <strong>The Walkin waitlist — only if you sign up.</strong> The form at{" "}
                  <Link href="/waitlist">walkingames.com/waitlist</Link> asks for one thing: your email
                  address.
                </p>
                <Facts
                  items={[
                    [
                      "What",
                      "The email address you type in. With it we record that you signed up through the form, the date and time, and the address of the page you sent the form from.",
                    ],
                    [
                      "Where",
                      "Our server passes your sign-up to the email-delivery service Resend, which sends it as an email to our studio mailbox. That mailbox is the list: there is no separate database.",
                    ],
                    [
                      "Why",
                      "To send what the waitlist promises: early-access and closed-test invites, surveys, and news about Walkin.",
                    ],
                    [
                      "Legal basis",
                      "Your consent (Art. 6(1)(a)). You can withdraw it at any time with the unsubscribe link in our messages or by emailing us; that does not affect messages sent before.",
                    ],
                    ["Who", "Resend (Plus Five Five, Inc., USA) and Zoho, which hosts our mailbox, both as our processors."],
                    ["Kept", "Until you leave the list or ask us to delete your address."],
                  ]}
                />
                <p>
                  To stop abuse, our server counts sign-up attempts per IP address (at most 10 an hour).
                  It holds the IP address only in its working memory for that count; the address is not
                  stored in a database or sent anywhere. If delivering a sign-up fails, the email address
                  can appear in the hosting error log described above.
                </p>
                <p>
                  After you sign up, the page saves a small marker in your browser’s local storage (
                  <code>walkin-waitlist-joined</code>) so it can show “You’re on the list” when you come
                  back. It never leaves your browser. The page’s “Not you? Join with another email”
                  button removes it, and so does clearing this site’s data in your browser.
                </p>

                <Sub id="what-we-do-not-do">What we do not do</Sub>
                <p>
                  No accounts or log-ins. No precise location. No contacts, photos, camera or microphone.
                  No chat or anything another player can see. No automated decisions that have legal or
                  similarly significant effects on you (GDPR Art. 22). Personalised advertising by the ad
                  networks is profiling; it only happens with your consent.
                </p>
              </Section>

              <Section n={4}>
                <p>
                  Walkin is made <strong>for players of all ages</strong>, including children. For US law
                  it is a <em>mixed-audience</em> service: aimed at everyone, not primarily at children.
                  We follow the US Children’s Online Privacy Protection Rule (COPPA), Google Play’s
                  Families policy, Apple’s rules and GDPR Article 8. Our contact details for parents are
                  in <Ref to="who-we-are">section 1</Ref>.
                </p>
                <p>
                  <strong>How we tell children apart.</strong> A neutral age screen — month and year of
                  birth, nothing preset, no hint which answer unlocks what — before any ad or analytics
                  code starts. Children are never blocked; they play the same game. The answer cannot be
                  changed by going back.
                </p>
                <p>
                  <strong>What we collect on the child path</strong> — from every player below their
                  country’s age of digital consent, and so from every child under 13 — all of it for the
                  “internal operations” of the game, which COPPA allows without parental consent:
                </p>
                <Table
                  label="What is collected on the child path"
                  head={["Persistent identifier / data", "Collected by", "Internal operation"]}
                  rows={[
                    [
                      "IP address, installation-scoped ID, device and app details, ad interaction",
                      "ironSource Ads, Unity Ads, Google AdMob (child-directed requests)",
                      <>
                        serving <strong>contextual</strong> ads, capping ad frequency, preventing fraud
                      </>,
                    ],
                    [
                      "Installation ID, crash and error report, device details",
                      "Unity Diagnostics",
                      "keeping the game working",
                    ],
                  ]}
                />
                <p>
                  The ad mediation, Unity LevelPlay, is also told the age band “child” (
                  <Ref to="ad-segment">3.5</Ref>) — nothing else about the player.
                </p>
                <p>
                  We collect <strong>nothing else</strong> from a child: no analytics, no advertising ID,
                  no name, no contact details. A child cannot make anything public in the game.
                </p>
                <p>
                  <strong>How we keep those identifiers from being used for anything else.</strong> Every
                  ad request on the child path carries the child-directed signals: LevelPlay’s COPPA and
                  child-directed flags, the device-ID opt-out, Google’s Families flag that allows only
                  self-certified ad SDKs, and AdMob’s child-directed treatment with a G content rating.
                  Under those flags the networks commit to contextual ads only and to not sharing
                  persistent identifiers with outside bidders. Unity Diagnostics uses the installation ID
                  only to group crash reports. Retention for each item is in{" "}
                  <Ref to="retention">section 6</Ref>: crash reports expire after 90 days, ad-network
                  data follows each network’s policy, and a child’s email is deleted right after we
                  answer.
                </p>
                <p>
                  <strong>In-app purchases by children</strong> go through Google Play or the App Store,
                  where parents can require approval for purchases (for example with Google Family Link
                  or Apple’s Ask to Buy).
                </p>
                <p>
                  <strong>Parents’ rights.</strong> You can ask us to review or delete what we hold about
                  your child, and to stop further collection. Write to <Mail />. Because we do not know
                  who your child is, tell us roughly when the game was installed. You can also stop all
                  collection at once by uninstalling the game, which removes everything stored on the
                  phone; crash reports then expire after 90 days.
                </p>
                <p>
                  <strong>Older children and teens in the EU.</strong> Under GDPR Article 8, consent from a
                  player below their country’s age of digital consent (16 unless a country lowered it,
                  never below 13) is not valid without a parent. We do not ask those players at all:
                  everyone below that age — a 15-year-old in Germany, for example — gets the same child
                  path as an under-13, with the same protections described above.
                </p>
              </Section>

              <Section n={5}>
                <Table
                  label="Your choices"
                  head={["Choice", "Where", "What it changes"]}
                  rows={[
                    [
                      "Personalised ads on / off",
                      <>
                        <strong>Settings → Privacy choices</strong> (players old enough to consent)
                      </>,
                      "from the next ad on, at the latest from the next launch",
                    ],
                    [
                      "Analytics on / off",
                      <>
                        <strong>Settings → Privacy choices</strong> (players old enough to consent)
                      </>,
                      <>
                        stops sending at once; turning it off does not delete what was sent — use{" "}
                        <em>Delete my data</em>
                      </>,
                    ],
                    [
                      "Delete my analytics data",
                      <>
                        <strong>Settings → Delete my data</strong>
                      </>,
                      <>
                        see <Ref to="deleting">section 10</Ref>
                      </>,
                    ],
                    [
                      "Advertising ID",
                      "Android: your phone’s settings, usually Settings → Privacy → Ads (reset or delete it). iOS: Settings → Privacy & Security → Tracking",
                      "the networks lose your ID",
                    ],
                    ["Notifications", "the game’s Settings, or your phone’s settings", "no more reminders"],
                    [
                      "Crash reports",
                      <>
                        cannot be switched off in the game; you can object (
                        <Ref to="your-rights">section 9</Ref>)
                      </>,
                      "—",
                    ],
                    [
                      "Waitlist emails",
                      <>
                        the unsubscribe link in any of our messages, or an email to <Mail />
                      </>,
                      "we remove your address from the list",
                    ],
                  ]}
                />
                <p>
                  Withdrawing consent is as easy as giving it and does not affect what happened before.
                  Saying no never costs you anything in the game: every ad reward and every item works the
                  same.
                </p>
              </Section>

              <Section n={6}>
                <Table
                  label="How long we keep data"
                  head={["Data", "Kept"]}
                  rows={[
                    [
                      "Save, age band, choices, local log",
                      "on your phone; the log 7 days; the rest until you uninstall",
                    ],
                    ["UGS Analytics (players who said yes)", "13 months, then deleted by Unity"],
                    ["Unity Diagnostics crash reports", "90 days, then deleted by Unity"],
                    [
                      "Ad networks",
                      "under each network’s policy — Unity up to 12 months; Google removes part of the IP address after 9 months",
                    ],
                    ["Order records we export", <Value key="tax" v={POLICY.taxRetention} />],
                    [
                      "Emails to support",
                      "12 months after the conversation ends; a child’s email is deleted right after we answer",
                    ],
                    ["Website request logs (Vercel)", "one hour to one day, depending on the hosting plan"],
                    ["Waitlist sign-ups", "until you leave the list or ask us to delete your address"],
                    [
                      "A record that we handled your rights request (date, what was done — no game data)",
                      "3 years, to show we did it",
                    ],
                  ]}
                />
              </Section>

              <Section n={7}>
                <Table
                  label="Who receives data"
                  head={["Recipient", "Role", "What for", "Their policy"]}
                  rows={[
                    [
                      "Unity Technologies (Unity Gaming Services Analytics, Diagnostics)",
                      "our processor",
                      <>
                        <Ref to="analytics">3.3</Ref>, <Ref to="crash-reports">3.4</Ref>
                      </>,
                      <Ext key="unity" href="https://unity.com/legal/game-player-and-app-user-privacy-policy" />,
                    ],
                    [
                      "Unity Technologies and its affiliate ironSource (LevelPlay mediation, ironSource Ads, Unity Ads)",
                      "independent controller for advertising",
                      <Ref key="ads" to="advertising">3.5</Ref>,
                      "same as above",
                    ],
                    [
                      "Google (AdMob, Google Play, Play Install Referrer, Android backup)",
                      "independent controller",
                      <>
                        <Ref to="advertising">3.5</Ref>, <Ref to="purchases">3.6</Ref>,{" "}
                        <Ref to="install-referrer">3.7</Ref>
                      </>,
                      <>
                        <Ext href="https://policies.google.com/privacy" />; for ads:{" "}
                        <Ext href="https://policies.google.com/technologies/partner-sites" />
                      </>,
                    ],
                    [
                      "Apple (App Store, iOS)",
                      "independent controller",
                      <Ref key="apple" to="purchases">3.6</Ref>,
                      <Ext key="apple-policy" href="https://www.apple.com/legal/privacy/" />,
                    ],
                    [
                      "Vercel Inc. (website hosting)",
                      "our processor",
                      <Ref key="vercel" to="website">3.10</Ref>,
                      <Ext key="vercel-policy" href="https://vercel.com/legal/privacy-notice" />,
                    ],
                    [
                      "Resend (waitlist email delivery)",
                      "our processor",
                      <Ref key="resend" to="website">3.10</Ref>,
                      <Ext key="resend-policy" href="https://resend.com/legal/privacy-policy" />,
                    ],
                    [
                      "Zoho (our email mailboxes)",
                      "our processor",
                      <>
                        <Ref to="email-us">3.9</Ref>, <Ref to="website">3.10</Ref>
                      </>,
                      <Ext key="zoho-policy" href="https://www.zoho.com/privacy.html" />,
                    ],
                    ["Authorities", "when the law requires it", "—", "—"],
                  ]}
                />
                <p>
                  Each of these partners is bound by its own terms with us and by law to protect your data
                  at least as well as this policy describes. We do not sell personal data, and we do not
                  give it to anyone else.
                </p>
              </Section>

              <Section n={8}>
                <p>We are based in Germany. Some partners process data outside the EU/EEA:</p>
                <ul>
                  <li>
                    <strong>Unity</strong> (USA) relies on the European Commission’s{" "}
                    <strong>Standard Contractual Clauses</strong>. ironSource is in <strong>Israel</strong>
                    , which the Commission recognises as adequate.
                  </li>
                  <li>
                    <strong>Google</strong> (USA) is certified under the{" "}
                    <strong>EU-US Data Privacy Framework</strong>, which the Commission found adequate on 10
                    July 2023.
                  </li>
                  <li>
                    <strong>Vercel</strong> and <strong>Resend</strong> (both USA) process website and
                    waitlist data under the Commission’s <strong>Standard Contractual Clauses</strong> in
                    their data processing terms with us; Resend is also certified under the EU-US Data
                    Privacy Framework.
                  </li>
                  <li>
                    <strong>Türkiye</strong> — access from Türkiye, where one of the two people who make
                    Walkin lives, is limited to what is needed to run and support the game and is covered
                    by the European Commission’s <strong>Standard Contractual Clauses</strong> (2021/914)
                    agreed with that person.
                  </li>
                </ul>
              </Section>

              <Section n={9}>
                <p>
                  Under the GDPR and UK GDPR you can ask us for <strong>access</strong> to your data,{" "}
                  <strong>correction</strong>, <strong>deletion</strong>, <strong>restriction</strong> of
                  use and a <strong>copy</strong> in a portable format; you can{" "}
                  <strong>withdraw consent</strong> at any time.
                </p>
                <blockquote className="privacy-callout">
                  <p>
                    <strong>Your right to object.</strong> Where we rely on legitimate interests (for
                    example crash reports, non-personalised ads and the player segment sent to our ad
                    mediation), you can object at any time on grounds
                    relating to your situation. We then stop unless we have compelling legitimate
                    grounds. Email <Mail />.
                  </p>
                </blockquote>
                <p>
                  <strong>How to ask:</strong> email <Mail />. We answer within <strong>one month</strong>;
                  for complex requests we may need two more months and will tell you why. It is free.
                  Because Walkin has no accounts, we may not be able to find data about you from your
                  email alone. If we cannot identify you, we will tell you, and you can help by sending
                  the details in <Ref to="children">section 4</Ref>.
                </p>
                <p>
                  <strong>Complaints:</strong> you can complain to a data protection authority, especially
                  where you live or work. Ours is the data protection authority of Rhineland-Palatinate:{" "}
                  {POLICY.authority.name}, {POLICY.authority.address},{" "}
                  <Ext href={POLICY.authority.url} />. In the UK it is the Information Commissioner’s
                  Office (<Ext href="https://ico.org.uk">ico.org.uk</Ext>).
                </p>
                <p>
                  <strong>United States.</strong> Depending on your state, you may have rights to know,
                  delete, correct and opt out of targeted advertising. We honour these requests from
                  anyone, wherever you live — email us. We do not sell personal data for money. If you
                  allow personalised ads, the ad networks use your device’s advertising ID to show ads
                  based on your activity in other apps, which some state laws call “sharing” or “targeted
                  advertising”; switch it off in <strong>Privacy choices</strong>. The California law
                  (CCPA) applies only to businesses above certain size thresholds; we answer such
                  requests anyway.
                </p>
              </Section>

              <Section n={10}>
                <ul>
                  <li>
                    <strong>Settings → Delete my data</strong> asks Unity to delete the analytics data
                    linked to your installation and stops analytics on this phone. Unity completes
                    deletion within <strong>30 days</strong>. The game keeps working; your save is not
                    touched.
                  </li>
                  <li>
                    <strong>Crash reports</strong> expire after 90 days. To have them deleted sooner, email
                    us (<Ref to="your-rights">section 9</Ref>).
                  </li>
                  <li>
                    <strong>Ad networks</strong> hold their data as independent controllers. Reset or
                    delete your advertising ID (<Ref to="your-choices">section 5</Ref>) and contact the
                    network — Unity: <Mail to="DPO@unity3d.com" />; Google: your Google account’s privacy
                    settings. We will help if you ask.
                  </li>
                  <li>
                    <strong>Your waitlist address</strong> is deleted when you unsubscribe or ask us to
                    remove it.
                  </li>
                  <li>
                    <strong>Everything on your phone</strong> is deleted when you uninstall the game. A
                    Google backup of your save stays in your Google account until you delete it there.
                  </li>
                </ul>
              </Section>

              <Section n={11}>
                <p>
                  All data the game sends travels encrypted (HTTPS), and so does everything sent to and
                  from this website. We collect as little as we can. Access to the dashboards that hold
                  player data is limited to the two people who make Walkin, with two-factor sign-in. We
                  follow a written information security program. No system is perfectly secure; if a
                  breach puts your data at risk, we will notify the authorities and, where required, you.
                </p>
              </Section>

              <Section n={12}>
                <p>
                  We update this policy when the game or the law changes. The date at the top shows the
                  current version. If a change matters — for example a new kind of data or a new partner —
                  we will tell you in the game before it applies, and ask again where consent is needed.
                </p>
              </Section>

              <Section n={13}>
                <Facts
                  wide
                  items={[
                    ["Email", <strong key="email"><Mail /></strong>],
                    ["Controller", controllerLine],
                    ["Postal address", POLICY.postalAddress],
                    ["Phone", <a key="phone" href={`tel:${POLICY.phone.replace(/\s/g, "")}`}>{POLICY.phone}</a>],
                  ]}
                />
              </Section>
            </article>
          </div>
        </div>
      </main>

      <div className="privacy-sheet privacy-sheet--footer">
        <footer className="shell site-footer">
          <Link href="/">WalkinGames</Link>
          <p>Privacy policy / {siteName}</p>
          <div className="site-footer__links">
            <a href="#main">Back to top ↑</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
