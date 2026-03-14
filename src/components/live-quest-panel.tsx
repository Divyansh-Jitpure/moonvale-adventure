"use client";

import Image from "next/image";

import { useGameProgress } from "@/components/use-game-progress";
import { getQuestStageDetails } from "@/lib/quest-data";

export function CompactQuestPanel() {
  const progress = useGameProgress();
  const stage = getQuestStageDetails(progress.questStage);

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
              {stage.title}
            </h2>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] ${getToneClass(stage.tone)}`}
          >
            {stage.tag}
          </span>
        </div>

        <p className="mt-2.5 max-w-[14rem] text-xs leading-5 text-stone-300">
          {stage.summary}
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
  const stage = getQuestStageDetails(progress.questStage);

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
                {stage.title}
              </h2>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getToneClass(stage.tone)}`}
            >
              {stage.tag}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-stone-300">
            {stage.summary}
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

function getToneClass(tone: "calm" | "active" | "recover" | "secure") {
  switch (tone) {
    case "active":
      return "text-rose-100 border-rose-300/25 bg-rose-300/10";
    case "recover":
      return "text-cyan-100 border-cyan-300/25 bg-cyan-300/10";
    case "secure":
      return "text-emerald-100 border-emerald-300/25 bg-emerald-300/10";
    default:
      return "text-amber-100 border-amber-300/25 bg-amber-300/10";
  }
}
