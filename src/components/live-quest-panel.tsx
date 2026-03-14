"use client";

import Image from "next/image";
import type { GameProgress } from "@/lib/game-progress";
import { useGameProgress } from "@/components/use-game-progress";

const stageLabel: Record<GameProgress["questStage"], string> = {
  available: "Talk to Brother Alden",
  accepted: "Defeat the red scout",
  scout_defeated: "Collect the dropped gold",
  reward_collected: "Return to Brother Alden",
  completed: "Moonvale route secured",
  second_route_available: "Take the northern route",
  second_route_active: "Defeat the red archer",
  archer_defeated: "Collect the arrow sigil",
  route_relic_collected: "Return with the sigil",
  second_route_completed: "Second route secured",
  wider_grove_available: "Open the wider grove",
  wider_grove_active: "Clear the eastern pack",
  wider_grove_completed: "Wider grove secured",
};

const stageSummary: Record<GameProgress["questStage"], string> = {
  available: "Meet Alden and take the first patrol route.",
  accepted: "The pond road scout is still active.",
  scout_defeated: "Pick up the token before reporting back.",
  reward_collected: "Return to Alden with proof of the clear.",
  completed: "The first route is recorded in the ledger.",
  second_route_available: "Alden can open the northern stones route.",
  second_route_active: "A red archer is holding the northern stones.",
  archer_defeated: "Recover the archer's sigil from the route.",
  route_relic_collected: "Return with the sigil to close the route.",
  second_route_completed: "Two combat routes are secured for Moonvale.",
  wider_grove_available: "Alden can now open the eastern grove gate.",
  wider_grove_active: "Break the mixed enemy pack in the wider grove.",
  wider_grove_completed: "The wider grove route is cleared and recorded.",
};

const stageTone: Record<GameProgress["questStage"], string> = {
  available: "text-amber-100 border-amber-300/25 bg-amber-300/10",
  accepted: "text-rose-100 border-rose-300/25 bg-rose-300/10",
  scout_defeated: "text-cyan-100 border-cyan-300/25 bg-cyan-300/10",
  reward_collected: "text-emerald-100 border-emerald-300/25 bg-emerald-300/10",
  completed: "text-emerald-100 border-emerald-300/25 bg-emerald-300/10",
  second_route_available: "text-cyan-100 border-cyan-300/25 bg-cyan-300/10",
  second_route_active: "text-rose-100 border-rose-300/25 bg-rose-300/10",
  archer_defeated: "text-cyan-100 border-cyan-300/25 bg-cyan-300/10",
  route_relic_collected: "text-emerald-100 border-emerald-300/25 bg-emerald-300/10",
  second_route_completed: "text-emerald-100 border-emerald-300/25 bg-emerald-300/10",
  wider_grove_available: "text-cyan-100 border-cyan-300/25 bg-cyan-300/10",
  wider_grove_active: "text-rose-100 border-rose-300/25 bg-rose-300/10",
  wider_grove_completed: "text-emerald-100 border-emerald-300/25 bg-emerald-300/10",
};

export function CompactQuestPanel() {
  const progress = useGameProgress();

  return (
    <div className="relative w-full max-w-[16rem] overflow-hidden rounded-[22px] border border-[#dcc48c]/35 bg-[#140f0a]/86 p-3 text-stone-100 shadow-[0_20px_48px_rgba(0,0,0,0.38)] backdrop-blur-sm">
      <Image
        src="/assets/ui/hud/special-paper-crop.png"
        alt=""
        fill
        className="object-cover opacity-18"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-amber-300/80">
              Active Route
            </p>
            <h2 className="mt-1.5 text-[15px] font-semibold leading-tight text-[#fff8e7] sm:text-base">
              {stageLabel[progress.questStage]}
            </h2>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] ${stageTone[progress.questStage]}`}
          >
            {progress.questStage.replaceAll("_", " ")}
          </span>
        </div>

        <p className="mt-2.5 max-w-[14rem] text-xs leading-5 text-stone-300">
          {stageSummary[progress.questStage]}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.14em] text-stone-300">
          <SummaryChip label="Health" value={`${progress.playerHealth}`} />
          <SummaryChip label="Area" value={progress.currentArea.replaceAll("_", " ")} />
          <SummaryChip
            label="Relics"
            value={`${progress.inventory.goldToken + progress.inventory.arrowSigil}/2`}
          />
        </div>
      </div>
    </div>
  );
}

export function LiveQuestPanel() {
  const progress = useGameProgress();

  return (
    <div className="grid gap-4">
      <section className="relative overflow-hidden rounded-[28px] border border-[#dcc48c]/28 bg-[#16110b]/92 p-4 text-stone-100">
        <Image
          src="/assets/ui/hud/special-paper-crop.png"
          alt=""
          fill
          className="object-cover opacity-18"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                Quest Ledger
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#fff8e7]">
                {stageLabel[progress.questStage]}
              </h2>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${stageTone[progress.questStage]}`}
            >
              {progress.questStage.replaceAll("_", " ")}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-stone-300">
            {stageSummary[progress.questStage]}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <LedgerMetric label="Health" value={`${progress.playerHealth} / 100`} />
            <LedgerMetric label="Stamina" value={`${progress.stamina} / 100`} />
            <LedgerMetric
              label="Current Area"
              value={progress.currentArea.replaceAll("_", " ")}
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[28px] border border-[#dcc48c]/28 bg-[#16110b]/92 p-4 text-stone-100">
        <Image
          src="/assets/ui/hud/wood-table-crop.png"
          alt=""
          fill
          className="object-cover opacity-16"
        />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Inventory
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {["Sword", "Gold", "Sigil", "Map"].map((slot, index) => {
              const filledGold = slot === "Gold" && progress.inventory.goldToken > 0;
              const filledSigil = slot === "Sigil" && progress.inventory.arrowSigil > 0;

              return (
                <div
                  key={slot}
                  className="relative flex h-18 items-end justify-between overflow-hidden rounded-[20px] border border-[#d7bf8c]/18 bg-black/22 p-2 text-[11px] uppercase tracking-[0.18em] text-stone-200"
                >
                  <Image
                    src="/assets/ui/hud/wood-slot-crop.png"
                    alt=""
                    fill
                    className="object-cover opacity-16"
                  />
                  {filledGold ? (
                    <Image
                      src="/assets/rewards/gold-resource.png"
                      alt="Gold token"
                      width={28}
                      height={28}
                      className="relative h-7 w-7 object-contain"
                    />
                  ) : filledSigil ? (
                    <Image
                      src="/assets/rewards/arrow-sigil.png"
                      alt="Arrow sigil"
                      width={28}
                      height={28}
                      className="relative h-7 w-7 object-contain"
                    />
                  ) : (
                    <span className="relative">{slot}</span>
                  )}
                  <span className="relative text-stone-500">{index + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[#dcc48c]/22 bg-black/24 px-2.5 py-1 text-stone-200">
      {label}: <span className="text-[#fff3c5]">{value}</span>
    </span>
  );
}

function LedgerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#d7bf8c]/18 bg-black/22 p-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-stone-100">{value}</p>
    </div>
  );
}
