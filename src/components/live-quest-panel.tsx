"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  defaultGameProgress,
  GAME_PROGRESS_EVENT,
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  type GameProgress,
} from "@/lib/game-progress";

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

const stageTone: Record<GameProgress["questStage"], string> = {
  available: "text-amber-100 border-amber-300/20 bg-amber-400/12",
  accepted: "text-rose-100 border-rose-300/20 bg-rose-400/12",
  scout_defeated: "text-cyan-100 border-cyan-300/20 bg-cyan-400/12",
  reward_collected: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
  completed: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
  second_route_available: "text-cyan-100 border-cyan-300/20 bg-cyan-400/12",
  second_route_active: "text-rose-100 border-rose-300/20 bg-rose-400/12",
  archer_defeated: "text-cyan-100 border-cyan-300/20 bg-cyan-400/12",
  route_relic_collected: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
  second_route_completed: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
  wider_grove_available: "text-cyan-100 border-cyan-300/20 bg-cyan-400/12",
  wider_grove_active: "text-rose-100 border-rose-300/20 bg-rose-400/12",
  wider_grove_completed: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
};

export function LiveQuestPanel() {
  const [progress, setProgress] = useState(defaultGameProgress);

  useEffect(() => {
    const sync = () => {
      setProgress(readGameProgress(window.localStorage.getItem(GAME_PROGRESS_STORAGE_KEY)));
    };

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<GameProgress>;
      if (customEvent.detail) {
        setProgress(customEvent.detail);
        return;
      }
      sync();
    };

    sync();
    window.addEventListener(GAME_PROGRESS_EVENT, handleCustomEvent);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(GAME_PROGRESS_EVENT, handleCustomEvent);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="grid gap-3">
      <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-black/35 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/85">
              Quest Ledger
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {stageLabel[progress.questStage]}
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${stageTone[progress.questStage]}`}
          >
            {progress.questStage.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          {progress.questStage === "available" && "Meet Brother Alden and accept the first route through the grove."}
          {progress.questStage === "accepted" && "The scout is still active near the pond road. Defeat it to advance the ledger."}
          {progress.questStage === "scout_defeated" && "The scout is down. Pick up the dropped gold to prove the route is clear."}
          {progress.questStage === "reward_collected" && "The gold token is secured. Return to Brother Alden to close the quest."}
          {progress.questStage === "completed" && "The first combat route is complete and recorded in the Moonvale ledger."}
          {progress.questStage === "second_route_available" && "Brother Alden has opened the northern route. Speak to him to begin the second expedition."}
          {progress.questStage === "second_route_active" && "A red archer is holding the northern stones. Defeat it to continue."}
          {progress.questStage === "archer_defeated" && "The archer is down. Recover its sigil from the route."}
          {progress.questStage === "route_relic_collected" && "The sigil is secured. Return to Brother Alden to lock in the second route."}
          {progress.questStage === "second_route_completed" && "Two combat routes are now recorded in the Moonvale ledger."}
          {progress.questStage === "wider_grove_available" && "Brother Alden can now open the eastern gate into the wider grove. Speak again to begin the new route."}
          {progress.questStage === "wider_grove_active" && "The wider grove is live. Break the mixed enemy pack holding the eastern ridge."}
          {progress.questStage === "wider_grove_completed" && "The wider grove encounter is cleared and the larger route is now secured for Moonvale."}
        </p>
      </div>

      <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-black/35 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/85">
          Inventory
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["Sword", "Gold", "Sigil", "Map"].map((slot, index) => {
            const filledGold = slot === "Gold" && progress.inventory.goldToken > 0;
            const filledSigil = slot === "Sigil" && progress.inventory.arrowSigil > 0;

            return (
              <div
                key={slot}
                className="relative flex h-16 items-end justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-2 text-[11px] uppercase tracking-[0.18em] text-stone-200"
              >
                <Image
                  src="/assets/ui/banner-slots.png"
                  alt=""
                  fill
                  className="object-cover opacity-20"
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
                <span className="relative text-stone-400">{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
