import * as Phaser from "phaser";

import { defaultGameProgress, GAME_PROGRESS_STORAGE_KEY, readGameProgress } from "@/lib/game-progress";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    const progress =
      typeof window === "undefined"
        ? defaultGameProgress
        : readGameProgress(window.localStorage.getItem(GAME_PROGRESS_STORAGE_KEY));

    this.scene.start(
      progress.currentArea === "wider_grove"
        ? "wider-grove"
        : progress.currentArea === "watch_hollow"
          ? "watch-hollow"
          : "overworld",
    );
  }
}
