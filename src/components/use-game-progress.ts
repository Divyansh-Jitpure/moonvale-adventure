"use client";

import { useEffect, useState } from "react";

import {
  defaultGameProgress,
  GAME_PROGRESS_EVENT,
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  type GameProgress,
} from "@/lib/game-progress";

export function useGameProgress() {
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

  return progress;
}
