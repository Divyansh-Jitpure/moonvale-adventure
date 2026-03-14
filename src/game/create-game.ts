import * as Phaser from "phaser";

import { BootScene } from "@/game/scenes/boot-scene";
import { OverworldScene } from "@/game/scenes/overworld-scene";
import { WiderGroveScene } from "@/game/scenes/wider-grove-scene";

export function createGame(parent: HTMLDivElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#081015",
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 600,
    },
    input: {
      gamepad: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, OverworldScene, WiderGroveScene],
  });
}
