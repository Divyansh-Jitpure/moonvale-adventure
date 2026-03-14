"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { useGameProgress } from "@/components/use-game-progress";
import type { GameProgress } from "@/lib/game-progress";

export function FieldHud() {
  const progress = useGameProgress();

  return (
    <>
      <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
        <StatusModule progress={progress} />
      </div>

      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <ObjectiveModule progress={progress} />
      </div>
    </>
  );
}

function StatusModule({ progress }: { progress: ReturnType<typeof useGameProgress> }) {
  const relicCount = progress.inventory.goldToken + progress.inventory.arrowSigil;

  return (
    <div className="pointer-events-auto w-[272px] rounded-[20px] border border-[#efd089]/28 bg-[linear-gradient(180deg,rgba(12,19,26,0.95),rgba(9,14,20,0.92))] p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.46)] backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-[#f1d189]/24 bg-[#111922] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <Image
            src="/assets/ui/tiny-swords/avatars/avatar-01.png"
            alt="Moonvale warrior portrait"
            fill
            className="object-cover object-top"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TinyAccentIcon icon="/assets/ui/tiny-swords/icons/icon-01.png" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e6c975]">
                Field Kit
              </p>
              <h2 className="max-w-[10.5rem] text-[18px] font-semibold leading-[1.02] text-[#fff7de] sm:text-[20px]">
                Moonvale Warrior
              </h2>
            </div>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <StatBar label="Health" value={progress.playerHealth} tone="health" />
            <StatBar label="Stamina" value={progress.stamina} tone="stamina" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f1e5c3]">
        <DataChip label="Area">{getAreaLabel(progress.currentArea)}</DataChip>
        <DataChip label="Relics">{relicCount}/2</DataChip>
        <DataChip label="Threat">{getThreatLabel(progress.questStage)}</DataChip>
      </div>
    </div>
  );
}

function ObjectiveModule({ progress }: { progress: ReturnType<typeof useGameProgress> }) {
  return (
    <div className="pointer-events-auto w-[296px] rounded-[20px] border border-[#efd089]/24 bg-[linear-gradient(180deg,rgba(31,24,15,0.95),rgba(21,16,10,0.92))] p-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.44)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TinyAccentIcon icon="/assets/ui/tiny-swords/icons/icon-09.png" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#dfbf6d]">
              Active Route
            </p>
          </div>
          <h2 className="mt-2 text-[24px] font-semibold leading-[0.96] text-[#fff1cd]">
            {getStageLabel(progress.questStage)}
          </h2>
        </div>
        <StageTag>{getStageTag(progress.questStage)}</StageTag>
      </div>

      <p className="mt-2.5 max-w-[14rem] text-[13px] leading-[1.35] text-[#dcc79a]">
        {getStageSummary(progress.questStage)}
      </p>
    </div>
  );
}

function TinyAccentIcon({ icon }: { icon: string }) {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center rounded-[9px] border border-[#f0d28a]/18 bg-[#131d26]">
      <Image src={icon} alt="" width={15} height={15} className="h-[15px] w-[15px] object-contain" />
    </span>
  );
}

function StatBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "health" | "stamina";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillClass =
    tone === "health"
      ? "from-[#d44a39] via-[#e56d4d] to-[#f2bf69]"
      : "from-[#1fb87f] via-[#59d47e] to-[#a4e67a]";

  return (
    <div className="grid grid-cols-[4.2rem_1fr_3rem] items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ecd9aa]">
        {label}
      </span>
      <div className="h-3.5 overflow-hidden rounded-full border border-[#fff1cf]/10 bg-[#020507]/64">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${fillClass} shadow-[0_0_18px_rgba(255,205,119,0.24)]`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-right text-[10px] font-semibold text-[#fff4d2]">{clamped}/100</span>
    </div>
  );
}

function DataChip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[13px] border border-white/7 bg-black/20 px-2.5 py-2">
      <p className="text-[8px] uppercase tracking-[0.2em] text-[#c8b691]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#fff1cd]">{children}</p>
    </div>
  );
}

function StageTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#f0d28a]/18 bg-[#402f1c]/52 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f7e2ab]">
      {children}
    </span>
  );
}

function getAreaLabel(area: GameProgress["currentArea"]) {
  return area === "wider_grove" ? "Wider Grove" : "Outpost";
}

function getThreatLabel(stage: GameProgress["questStage"]) {
  switch (stage) {
    case "available":
    case "accepted":
      return "Low";
    case "second_route_available":
    case "second_route_active":
      return "Medium";
    case "wider_grove_available":
    case "wider_grove_active":
      return "High";
    case "wider_grove_completed":
      return "Clear";
    default:
      return "Watch";
  }
}

function getStageTag(stage: GameProgress["questStage"]) {
  switch (stage) {
    case "scout_defeated":
    case "archer_defeated":
    case "reward_collected":
    case "route_relic_collected":
      return "Recover";
    case "completed":
    case "second_route_completed":
    case "wider_grove_completed":
      return "Secure";
    case "wider_grove_available":
    case "second_route_available":
      return "Brief";
    default:
      return "Active";
  }
}

function getStageLabel(stage: GameProgress["questStage"]) {
  switch (stage) {
    case "available":
      return "Speak with Brother Alden";
    case "accepted":
      return "Defeat the pond road scout";
    case "scout_defeated":
      return "Collect the gold token";
    case "reward_collected":
      return "Return to Brother Alden";
    case "completed":
      return "First route secured";
    case "second_route_available":
      return "Open the northern stones";
    case "second_route_active":
      return "Defeat the red archer";
    case "archer_defeated":
      return "Collect the arrow sigil";
    case "route_relic_collected":
      return "Return with the sigil";
    case "second_route_completed":
      return "Second route secured";
    case "wider_grove_available":
      return "Open the wider grove";
    case "wider_grove_active":
      return "Clear the eastern pack";
    case "wider_grove_completed":
      return "Wider grove secured";
    default:
      return "Route recorded";
  }
}

function getStageSummary(stage: GameProgress["questStage"]) {
  switch (stage) {
    case "available":
      return "Take Alden's patrol brief.";
    case "accepted":
      return "The scout is still on the pond road.";
    case "scout_defeated":
      return "Pick up the proof before reporting back.";
    case "reward_collected":
      return "Bring the token back to the chapel.";
    case "completed":
      return "Moonvale has one safe route again.";
    case "second_route_available":
      return "Alden can unlock the northern stones path.";
    case "second_route_active":
      return "The archer still controls the stones.";
    case "archer_defeated":
      return "Take the sigil left on the route.";
    case "route_relic_collected":
      return "Return the sigil to close the route.";
    case "second_route_completed":
      return "Two routes now answer to Moonvale.";
    case "wider_grove_available":
      return "The grove gate can be opened now.";
    case "wider_grove_active":
      return "Break the scout and archer pack.";
    case "wider_grove_completed":
      return "The frontier route is recorded and quiet.";
    default:
      return "The ledger is waiting for the next route.";
  }
}
