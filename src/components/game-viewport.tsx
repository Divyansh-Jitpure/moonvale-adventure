"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

import {
  AUDIO_SETTINGS_EVENT,
  AUDIO_SETTINGS_STORAGE_KEY,
  readAudioEnabled,
} from "@/lib/audio-settings";

export function GameViewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let destroyed = false;
    let currentGame: Phaser.Game | null = null;

    if (!hostRef.current) {
      return;
    }

    void import("@/game/create-game").then(({ createGame }) => {
      if (destroyed || !hostRef.current) {
        return;
      }

      currentGame = createGame(hostRef.current);
      currentGame.sound.mute = !readAudioEnabled(
        window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY),
      );
    });

    const handleAudioUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      const enabled =
        typeof customEvent.detail === "boolean"
          ? customEvent.detail
          : readAudioEnabled(window.localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY));
      if (currentGame) currentGame.sound.mute = !enabled;
    };

    window.addEventListener(AUDIO_SETTINGS_EVENT, handleAudioUpdate);

    return () => {
      destroyed = true;
      window.removeEventListener(AUDIO_SETTINGS_EVENT, handleAudioUpdate);
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
