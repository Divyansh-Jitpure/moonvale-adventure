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
    <div className="h-full overflow-hidden rounded-[18px] border border-white/6 bg-[#09171c] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <div
        ref={hostRef}
        className="h-full w-full"
        aria-label="Moonvale adventure game viewport"
      />
    </div>
  );
}
