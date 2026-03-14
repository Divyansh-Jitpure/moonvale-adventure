import { FieldLedgerDock } from "@/components/field-ledger-dock";
import { FieldHud } from "@/components/field-hud";
import { GameViewport } from "@/components/game-viewport";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#304744_0%,_#162126_38%,_#081015_100%)] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(224,191,121,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(111,207,151,0.12),_transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,_rgba(8,16,21,0.78),_transparent)]" />
      <section className="relative h-screen w-full p-2 sm:p-3">
        <GameViewport />
      </section>

      <section className="pointer-events-none absolute inset-0 z-10 p-2 sm:p-3">
        <FieldHud />
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
          <FieldLedgerDock />
        </div>
      </section>
    </main>
  );
}
