import { GameViewport } from "@/components/game-viewport";

const controls = [
  "Move: WASD / Arrow keys / Left stick / D-pad",
  "Sprint: Shift / Gamepad south button",
  "Interact pulse: Space / Gamepad east button",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#31525b_0%,_#142126_42%,_#081015_100%)] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <section className="rounded-[32px] border border-white/12 bg-black/20 p-6 backdrop-blur md:p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">
            Moonvale Adventure
          </p>
          <h1 className="mt-4 font-sans text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            A playable 2D adventure prototype with controller support from day one.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
            Next.js handles the shell and UI. Phaser runs the world, animation, camera,
            and input loop. This first slice gives you a roaming forest clearing, an
            animated hero, and gamepad-aware movement.
          </p>

          <div className="mt-8 grid gap-3">
            {controls.map((control) => (
              <div
                key={control}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-200"
              >
                {control}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
              Next build targets
            </p>
            <p className="mt-2 text-sm leading-7 text-emerald-50/90">
              Tilemap streaming, NPC dialogue, quests, and combat can all sit on top of
              the structure wired here without rewriting the render loop.
            </p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/12 bg-[#071216]/80 p-3 shadow-2xl shadow-black/30 backdrop-blur md:p-4">
          <GameViewport />
        </section>
      </div>
    </main>
  );
}
