export type JourneyMedia = {
  src: string;
  poster: string;
  alt: string;
  width: number;
  height: number;
};

const mediaRoot = "/media/walkin-journey";
const clip = (name: string, alt: string, height = 960): JourneyMedia => ({
  src: `${mediaRoot}/${name}.mp4`,
  poster: `${mediaRoot}/${name}.webp`,
  alt,
  width: 540,
  height,
});

export const journeyMedia = {
  brooklyn: clip("brooklyn", "A survivor sits on a rooftop ledge above Brooklyn before jumping down onto the bridge road to begin the run."),
  foundation: clip("foundation", "A survivor runs across the Brooklyn bridge at night, weaving between zombie crowds, wrecked cars and road hazards."),
  cards: clip("cards", "Walkin's upgrade cards collection screen showing ability and weapon cards being inspected and upgraded."),
  interface: clip("interface", "Walkin's live mobile interface on the rooftop, connecting character selection, weapon loadouts and upgrades."),
  progression: clip("progression", "Opening a reward crate on the rooftop to unlock a mask collectible, followed by the in-game shop and consumables."),
  survival: clip("survival", "Survivors fight and evade through a crowded bridge and tunnel using weapons, syringes and survival tools."),
  gameloop: clip("gameloop", "A continuous run loop: fighting zombies on the road, choosing from the in-run upgrade card carousel, and continuing the run."),
  today: clip("today", "Survivors run down a neon-lit Brooklyn street lined with Walkin billboards, firing into an approaching zombie horde."),
};

export type JourneyMilestone = {
  id: string;
  month: string;
  dateTime: string;
  phase: string;
  title: string;
  body: string;
  detail: string;
  tags: string[];
  caption: string;
  layout: "wide" | "split" | "portrait" | "sequence" | "still";
  media: JourneyMedia;
};

// Month-level editorial chronology supplied by the team, not release dates.
// Footage illustrates these systems; it is not a dated archive of each build.
export const milestones: JourneyMilestone[] = [
  {
    id: "foundation", month: "March", dateTime: "2026-03", phase: "The foundation",
    title: "Building the zombie world.",
    body: "Before there was a complete run, there had to be a world worth surviving. We built an ECS-based enemy simulation and brought the crowd to life with Rukhanka animation.",
    detail: "High-volume simulation lives in DOTS. Game flow stays flexible in a hybrid Unity architecture.",
    tags: ["Unity ECS", "Rukhanka", "First encounters"],
    caption: "The foundation / movement, enemies, animation",
    layout: "portrait", media: journeyMedia.foundation,
  },
  {
    id: "upgrades", month: "April", dateTime: "2026-04", phase: "Player progression",
    title: "Giving every run a build.",
    body: "Surviving became a series of choices. Upgrade cards gave each run a direction: change your weapon, strengthen an ability, or build around the next encounter.",
    detail: "Data-driven upgrades leave room for new combinations. Blender, Figma and Photoshop support the visual iteration behind each choice.",
    tags: ["Upgrade cards", "Run-by-run choices"],
    caption: "Choose and upgrade your cards",
    layout: "split", media: journeyMedia.cards,
  },
  {
    id: "interface", month: "May", dateTime: "2026-05", phase: "The UI foundation",
    title: "Every system, connected.",
    body: "Menus, loadouts and gameplay information needed to speak the same language. We connected them through a responsive interface built around clear actions and readable states.",
    detail: "The actual game UI, not a wireframe: character selection, equipment and progression brought into one place.",
    tags: ["Responsive UI", "Loadouts", "Game states"],
    caption: "Inside the interface / recorded in-game",
    layout: "portrait", media: journeyMedia.interface,
  },
  {
    id: "content", month: "June", dateTime: "2026-06", phase: "Content systems",
    title: "Built to grow.",
    body: "Characters, weapons and upgrade cards became parts of the same progression framework. The aim was to add content without rebuilding the systems underneath it.",
    detail: "ScriptableObject definitions describe the content; Addressables handle its delivery. The framework supports both run choices and progression between runs.",
    tags: ["Characters", "Weapons", "Persistent progression"],
    caption: "Beyond one run / progression and rewards",
    layout: "portrait", media: journeyMedia.progression,
  },
  {
    id: "survival", month: "July", dateTime: "2026-07", phase: "Items & survival tools",
    title: "More ways to survive.",
    body: "Combat became more than shooting. Medkits, bombs and usable items expanded the choices available when the road became crowded.",
    detail: "Fight, evade, or spend a resource. The goal is pressure that asks for a decision, not just a faster road.",
    tags: ["Fight", "Evade", "Use your resources"],
    caption: "The survival loop / fight, evade and use your tools",
    layout: "split", media: journeyMedia.survival,
  },
  {
    id: "game-loop", month: "August", dateTime: "2026-08", phase: "Connecting the experience",
    title: "From systems to a game.",
    body: "Movement, aiming, combat and upgrades began to work as one experience. A run now had a rhythm: face the pressure, make a choice, and go again with a different build.",
    detail: "The important step was not another isolated feature. It was making the hand-off between systems feel like one continuous game.",
    tags: ["Run", "Choose", "Continue"],
    caption: "Run. Choose. Adapt. Keep going.",
    layout: "sequence", media: journeyMedia.gameloop,
  },
  {
    id: "today", month: "September", dateTime: "2026-09", phase: "Where Walkin is today",
    title: "This is Walkin today.",
    body: "A playable foundation for the last survivors of Brooklyn: continuous movement, one-thumb aiming, zombie combat, upgrade choices and progression that carries beyond a single run.",
    detail: "Still in development. The foundation is playable; the wider world of enemies, hazards and bosses is the direction ahead, not a claim of finished content.",
    tags: ["Playable foundation", "In development"],
    caption: "Current gameplay / September 2026 development journal",
    layout: "portrait", media: journeyMedia.today,
  },
];
