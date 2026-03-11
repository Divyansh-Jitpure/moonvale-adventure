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
};

const stageTone: Record<GameProgress["questStage"], string> = {
  available: "text-amber-100 border-amber-300/20 bg-amber-400/12",
  accepted: "text-rose-100 border-rose-300/20 bg-rose-400/12",
  scout_defeated: "text-cyan-100 border-cyan-300/20 bg-cyan-400/12",
  reward_collected: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
  completed: "text-emerald-100 border-emerald-300/20 bg-emerald-400/12",
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
        </p>
      </div>

      <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-black/35 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/85">
          Inventory
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["Sword", "Talk", "Gold", "Map"].map((slot, index) => {
            const filled = slot === "Gold" && progress.inventory.goldToken > 0;

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
                {filled ? (
                  <Image
                    src="/assets/rewards/gold-resource.png"
                    alt="Gold token"
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
