import Image from "next/image";
import Link from "next/link";

import { GameViewport } from "@/components/game-viewport";
import { LiveQuestPanel } from "@/components/live-quest-panel";

const controls = [
  "Move: WASD / Arrow keys / Left stick / D-pad",
  "Sprint: Shift / Gamepad south button",
  "Attack: Space / Gamepad east button",
  "Talk: E / Gamepad west button",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#31525b_0%,_#142126_42%,_#081015_100%)] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(224,191,121,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(111,207,151,0.12),_transparent_30%)]" />
      <section className="relative h-screen w-full p-3 sm:p-4">
        <GameViewport />
      </section>

      <section className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4">
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
            <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-black/35 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/85">
                Moonvale Adventure
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Warrior HUD
              </h1>
              <div className="mt-4 space-y-3">
                <HudBar label="Health" value="100 / 100" width="100%" color="from-rose-500 to-orange-300" />
                <HudBar label="Stamina" value="72 / 100" width="72%" color="from-emerald-500 to-lime-300" />
                <HudBar label="Threat" value="Three hostile routes" width="78%" color="from-amber-500 to-yellow-300" />
              </div>
            </div>

            <div className="pointer-events-auto flex w-full max-w-sm flex-col gap-3">
              <LiveQuestPanel />
              <Link
                href="/milestones"
                className="inline-flex items-center gap-3 self-start rounded-full border border-amber-200/30 bg-amber-300/12 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/18"
              >
                <Image
                  src="/assets/ui/banner-slots.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                Open milestone world log
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-black/35 p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                  Action Bar
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {controls.map((control) => (
                    <div
                      key={control}
                      className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-stone-200"
                    >
                      {control}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-300 sm:max-w-sm">
                The ledger, rewards, and route unlocks now persist across reloads, so
                Moonvale keeps the outpost routes and the wider grove recorded after you leave the page.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HudBar({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width }} />
      </div>
    </div>
  );
}
