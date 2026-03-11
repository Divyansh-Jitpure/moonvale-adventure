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
    status: "Next",
    summary: "Add enemies, pickups, attack hitboxes, and a clearer quest objective.",
    details: [
      "Spawn at least one hostile unit with health, knockback, and aggro range.",
      "Add a collectible or reward that proves the loop is working.",
      "Reflect combat state back into the HUD and milestone log.",
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
                  2 milestones complete
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
                <ProgressCard label="World" value="Outpost live" />
                <ProgressCard label="Next" value="Combat loop" />
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
