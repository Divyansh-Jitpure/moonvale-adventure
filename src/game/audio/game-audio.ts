import * as Phaser from "phaser";

export const SOUND_KEYS = {
  swing: "sfx-swing",
  enemyHit: "sfx-enemy-hit",
  playerHit: "sfx-player-hit",
  pickup: "sfx-pickup",
  routeClear: "sfx-route-clear",
  ambientOutpost: "ambient-outpost",
  ambientWiderGrove: "ambient-wider-grove",
  ambientWatchHollow: "ambient-watch-hollow",
} as const;

export function preloadGameAudio(scene: Phaser.Scene) {
  scene.load.audio(SOUND_KEYS.swing, "/assets/audio/sfx/swing.wav");
  scene.load.audio(SOUND_KEYS.enemyHit, "/assets/audio/sfx/enemy-hit.wav");
  scene.load.audio(SOUND_KEYS.playerHit, "/assets/audio/sfx/player-hit.wav");
  scene.load.audio(SOUND_KEYS.pickup, "/assets/audio/sfx/pickup.wav");
  scene.load.audio(SOUND_KEYS.routeClear, "/assets/audio/sfx/route-clear.wav");
  scene.load.audio(SOUND_KEYS.ambientOutpost, "/assets/audio/ambient/outpost-loop.wav");
  scene.load.audio(SOUND_KEYS.ambientWiderGrove, "/assets/audio/ambient/wider-grove-loop.wav");
  scene.load.audio(SOUND_KEYS.ambientWatchHollow, "/assets/audio/ambient/watch-hollow-loop.wav");
}

export function playSfx(
  scene: Phaser.Scene,
  key: (typeof SOUND_KEYS)[keyof typeof SOUND_KEYS],
  config?: Phaser.Types.Sound.SoundConfig,
) {
  if (!scene.sound || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, { volume: 0.38, ...config });
}

export function startAmbientLoop(
  scene: Phaser.Scene,
  key: (typeof SOUND_KEYS)[keyof typeof SOUND_KEYS],
  config?: Phaser.Types.Sound.SoundConfig,
) {
  if (!scene.sound || !scene.cache.audio.exists(key)) return null;
  const sound = scene.sound.add(key, { loop: true, volume: 0.14, ...config });
  sound.play();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    sound.stop();
    sound.destroy();
  });
  return sound;
}
