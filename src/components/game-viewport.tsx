"use client";

import { useEffect, useRef } from "react";

export function GameViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let destroyed = false;
    let currentGame: { destroy(removeCanvas?: boolean): void } | null = null;

    if (!hostRef.current) {
      return;
    }

    void import("@/game/create-game").then(({ createGame }) => {
      if (destroyed || !hostRef.current) {
        return;
      }

      currentGame = createGame(hostRef.current);
    });

    return () => {
      destroyed = true;
      currentGame?.destroy(true);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09171c]">
      <div
        ref={hostRef}
        className="aspect-[16/10] w-full"
        aria-label="Moonvale adventure game viewport"
      />
    </div>
  );
}
