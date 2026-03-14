import Image from "next/image";
import Link from "next/link";

const milestones = [
  {
    title: "Foundations of Moonvale",
    status: "Complete",
    summary: "Next.js, Phaser, warrior movement, controller support, and the first playable shell.",
    details: [
      "Mounted Phaser cleanly inside the app shell without breaking Next prerendering.",
      "Integrated the Tiny Swords warrior sheets for idle, run, and attack states.",
      "Added keyboard plus controller input and verified the build pipeline.",
    ],
  },
  {
    title: "Moonvale Outpost",
    status: "Complete",
    summary: "Tile-backed ground, outpost props, a monk NPC, collision bodies, and first dialogue interaction.",
    details: [
      "Built the first real traversal space using Tiny Swords terrain, building, and prop art.",
      "Added an interact prompt and a three-step conversation with Brother Alden.",
      "Turned the prototype clearing into a milestone-based exploration beat.",
    ],
  },
  {
    title: "Living Grove",
    status: "Complete",
    summary: "One hostile scout, sword hit timing, knockback, a gold drop, and return-to-NPC guidance.",
    details: [
      "Spawned a hostile red scout that patrols the pond road and chases the player.",
      "Added a real attack window, enemy damage, knockback, and player hit feedback.",
      "Dropped a reward on defeat and updated Brother Alden's route once the combat loop resolves.",
    ],
  },
  {
    title: "Quest Ledger",
    status: "Complete",
    summary: "Quest stage now persists, the gold reward enters inventory, and the HUD reads saved progress.",
    details: [
      "Persisted quest stage transitions through local storage so the route survives reloads.",
      "Stored the gold token in inventory and surfaced it in the live HUD.",
      "Hooked the shell UI into scene progress so the ledger reflects real game state instead of static copy.",
    ],
  },
  {
    title: "Second Route",
    status: "Complete",
    summary: "Expanded the grove with a northern archer route, a second reward, and multi-step quest progression.",
    details: [
      "Added a second combat route with a ranged red archer guarding the northern stones.",
      "Extended the quest flow beyond one room: first route, unlock, second route, second reward, return.",
      "Persisted the second sigil in inventory so the route chain remains visible in the HUD and log.",
    ],
  },
  {
    title: "Scene Systems",
    status: "Complete",
    summary: "Split the overworld into cleaner data, progress, and input systems so the next zone can grow without one file owning everything.",
    details: [
      "Moved static overworld configuration out of the main scene and into shared data helpers.",
      "Pulled quest-stage and persistence rules into dedicated progress utilities instead of keeping them buried in scene methods.",
      "Isolated keyboard and controller handling so new scenes can reuse the same input approach with less duplication.",
    ],
  },
  {
    title: "Wider Grove",
    status: "Complete",
    summary: "Expanded Moonvale into a second playable area with a persistent transition and a mixed enemy pack guarding the eastern route.",
    details: [
      "Added a wider eastern grove as a second playable space instead of stretching the outpost into one oversized scene.",
      "Hooked progression into a real area transition so reloads preserve whether the player is in the outpost or the grove.",
      "Built a mixed encounter with a frontline scout and backline archer so route pressure comes from enemy combination, not one target at a time.",
    ],
  },
  {
    title: "Field Kit HUD",
    status: "Complete",
    summary: "Rebuilt the shell HUD into a readable edge overlay with live status, a cleaner route card, and a compact ledger dock that stops blocking the map.",
    details: [
      "Moved the always-visible interface into top-corner modules so the center of the screen stays open for traversal and combat.",
      "Split detailed quest and inventory reading into a field ledger drawer while keeping health, stamina, and the active route live at a glance.",
      "Used Tiny Swords UI accents and a darker shell treatment so the HUD feels grounded in Moonvale instead of reading like a web dashboard.",
    ],
  },
  {
    title: "Frontier Threads",
    status: "Complete",
    summary: "Moved quest copy and stage behavior into shared route definitions, then proved it with a new Watch Hollow branch off the outpost.",
    details: [
      "Centralized stage titles, summaries, hints, dialogue, and transition data so the HUD, outpost scene, and route helpers all read from one quest source.",
      "Added Watch Hollow as a western branch that opens after the wider grove and reuses the same area-transition structure instead of adding another one-off scene path.",
      "Let the outpost route map track four frontier states at once, proving Moonvale can now branch without every new step being buried in scene-specific conditionals.",
    ],
  },
  {
    title: "Sounding Steel",
    status: "Next",
    summary: "Add the first combat and world sound layer so Moonvale stops feeling silent while the route structure continues to grow.",
    details: [
      "Add sword swings, hits, pickups, and route-clear cues to make combat feedback land harder.",
      "Introduce ambient scene layers so the outpost, grove, and hollow feel distinct even when the art set is shared.",
      "Make the audio system easy to extend so each future frontier route can declare its own sound palette without scene copy-paste.",
    ],
  },
];

const ideas = [
  {
    title: "Procedural Map Generation",
    summary: "Explore constrained procedural generation for future Moonvale routes instead of treating every new zone as a fully hand-laid scene.",
    details: [
      "Generate route layouts from authored chunks so Moonvale keeps a deliberate shape instead of turning into pure randomness.",
      "Use procedural placement for props, choke points, and encounter groups after the quest structure is more reusable.",
      "Keep milestone-critical spaces and major quest beats authored so pacing and world tone stay under control.",
    ],
  },
];

const sidequests = [
  {
    title: "Controller And Stability Patch",
    status: "Complete",
    summary: "Smaller support work that fixed controller interaction rough edges and hardened scene hint updates during transitions.",
    details: [
      "Broadened the Xbox-style controller interaction mapping so talk prompts and route gates respond more reliably.",
      "Fixed the outpost archer activation issue where the route could be live in the ledger while the enemy never actually appeared.",
      "Guarded delayed controller hint updates so scene transitions stop stale callbacks from crashing the renderer.",
    ],
  },
  {
    title: "Field Kit Polish Pass",
    status: "Complete",
    summary: "Follow-up HUD work tightened the new field kit after the first art pass landed too noisy and fragile on top of the map.",
    details: [
      "Dropped the broken bottom action rail and oversized panel experiments that were making the interface feel cluttered instead of useful.",
      "Retuned the top status and route cards with stronger contrast, smaller footprints, and a final Moonvale Warrior title that stays inside the shell.",
      "Added cropped Tiny Swords UI assets into the repo so future HUD work can build from stable pieces instead of stretching source sheets directly.",
    ],
  },
];

export default function MilestonesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#102126_0%,_#091218_100%)] px-4 py-8 text-stone-100 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] border border-[#d7bf8c]/25 bg-[#0b161b] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <Image
            src="/assets/ui/wood-table.png"
            alt=""
            fill
            className="object-cover opacity-18"
          />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="relative inline-block">
                <Image
                  src="/assets/ui/banner.png"
                  alt=""
                  width={220}
                  height={220}
                  className="h-20 w-auto object-contain opacity-85"
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold uppercase tracking-[0.35em] text-[#f6e7bb]">
                  World Log
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Milestone map for building Moonvale step by step.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-300">
                This page tracks the game like a campaign route instead of a dev diary.
                Each stop marks a concrete slice of the world we have already shipped or
                are about to unlock.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-stone-100 transition hover:bg-white/12"
                >
                  Return to outpost
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  9 milestones complete
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
              <Image
                src="/assets/ui/paper-special.png"
                alt=""
                width={448}
                height={448}
                className="h-48 w-full rounded-[22px] object-cover object-center opacity-90"
              />
              <div className="grid grid-cols-3 gap-3">
                <ProgressCard label="Core" value="Phaser + input" />
                <ProgressCard label="World" value="Outpost + grove" />
                <ProgressCard label="Next" value="Sounding steel" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Campaign Route
            </p>
            <div className="mt-5 space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.title}
                  className="rounded-[24px] border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${milestone.status === "Complete" ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-300/15 text-amber-100"}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{milestone.title}</p>
                      <p className="mt-1 text-sm text-stone-400">{milestone.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone) => (
              <details
                key={milestone.title}
                open={milestone.status === "Complete"}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                      {milestone.status}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {milestone.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">
                      {milestone.summary}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-200">
                    Details
                  </span>
                </summary>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <div className="space-y-3">
                    {milestone.details.map((detail) => (
                      <label
                        key={detail}
                        className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/18 p-3 text-sm leading-6 text-stone-200"
                      >
                        <input
                          type="checkbox"
                          checked={milestone.status === "Complete"}
                          readOnly
                          className="mt-1 h-4 w-4 accent-emerald-400"
                        />
                        <span>{detail}</span>
                      </label>
                    ))}
                  </div>

                  <div className="relative min-h-56 overflow-hidden rounded-[24px] border border-[#d7bf8c]/20 bg-[#0f1b20]">
                    <Image
                      src="/assets/ui/big-ribbons.png"
                      alt=""
                      fill
                      className="object-cover opacity-16"
                    />
                    <div className="relative flex h-full flex-col justify-between p-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-amber-300/85">
                          Milestone Reward
                        </p>
                        <p className="mt-3 text-lg font-semibold text-white">
                          {milestone.status === "Complete"
                            ? "Unlocked route on the Moonvale map"
                            : "Waiting for the next expedition"}
                        </p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-black/25 p-4 text-sm leading-6 text-stone-300">
                        {milestone.status === "Complete"
                          ? "This stop is now part of the playable route. Build quality matters more than speed, so each finished milestone should leave behind a real feature."
                          : "The next route opens when combat, rewards, and quest feedback form a complete loop."}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                Sidequests
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Small fixes and field patches
              </h2>
            </div>
            <div className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-100">
              Support work outside the main route
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {sidequests.map((sidequest) => (
              <div
                key={sidequest.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.07),_rgba(255,255,255,0.03))] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/75">
                      Sidequest
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{sidequest.title}</h3>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100">
                    {sidequest.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-300">{sidequest.summary}</p>
                <div className="mt-4 space-y-3">
                  {sidequest.details.map((detail) => (
                    <div
                      key={detail}
                      className="rounded-2xl border border-white/8 bg-black/18 p-3 text-sm leading-6 text-stone-200"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                Ideas Shelf
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Things worth thinking on later
              </h2>
            </div>
            <div className="rounded-full border border-cyan-300/20 bg-cyan-400/12 px-4 py-2 text-sm text-cyan-100">
              Not committed milestones
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {ideas.map((idea) => (
              <div
                key={idea.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.07),_rgba(255,255,255,0.03))] p-5"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">
                  Idea
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{idea.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-300">{idea.summary}</p>
                <div className="mt-4 space-y-3">
                  {idea.details.map((detail) => (
                    <div
                      key={detail}
                      className="rounded-2xl border border-white/8 bg-black/18 p-3 text-sm leading-6 text-stone-200"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProgressCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
