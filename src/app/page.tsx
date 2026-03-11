import { GameViewport } from "@/components/game-viewport";

const controls = [
  "Move: WASD / Arrow keys / Left stick / D-pad",
  "Sprint: Shift / Gamepad south button",
  "Attack: Space / Gamepad east button",
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
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-300">
                    <span>Health</span>
                    <span>84 / 100</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-rose-500 to-orange-300" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-stone-300">
                    <span>Stamina</span>
                    <span>61 / 100</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10">
                    <div className="h-full w-[61%] rounded-full bg-gradient-to-r from-emerald-500 to-lime-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-black/35 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/85">
                    Current Quest
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    Search the Moonvale grove
                  </h2>
                </div>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                  Controller Ready
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                Reach the pond, test the warrior attack, and confirm both keyboard
                and controller input before we add enemies and dialogue.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-black/35 p-4 backdrop-blur-md sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
                  Action Bar
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
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

              <div className="grid grid-cols-4 gap-2 sm:w-auto">
                {["Sword", "Guard", "Potion", "Map"].map((slot, index) => (
                  <div
                    key={slot}
                    className="flex h-16 w-16 items-end justify-between rounded-2xl border border-white/10 bg-white/8 p-2 text-[11px] uppercase tracking-[0.18em] text-stone-200"
                  >
                    <span>{slot}</span>
                    <span className="text-stone-400">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
