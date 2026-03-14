export type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  attack: boolean;
  interact: boolean;
};

export const TILE_SIZE = 96;
export const WORLD_COLS = 16;
export const WORLD_ROWS = 12;
export const WORLD_WIDTH = WORLD_COLS * TILE_SIZE;
export const WORLD_HEIGHT = WORLD_ROWS * TILE_SIZE;

export const PLAYER_SPEED = 170;
export const ENEMY_SPEED = 82;
export const ARCHER_SPEED = 68;
export const PROJECTILE_SPEED = 210;
export const SPRINT_MULTIPLIER = 1.45;
export const GAMEPAD_DEADZONE = 0.2;

export const WARRIOR_FRAME = 192;
export const MONK_FRAME = 192;
export const ENEMY_FRAME = 192;

export const PLAYER_SCALE = 0.5;
export const NPC_SCALE = 0.48;
export const ENEMY_SCALE = 0.5;
export const TALK_DISTANCE = 120;
export const AGGRO_DISTANCE = 240;
export const LEASH_DISTANCE = 340;
export const ARCHER_RANGE = 310;

export const PLAYER_MAX_HEALTH = 100;
export const SCOUT_MAX_HEALTH = 3;
export const ARCHER_MAX_HEALTH = 4;

export const MAP_DATA = Array.from({ length: WORLD_ROWS }, () =>
  Array.from({ length: WORLD_COLS }, () => 0),
);

export const PROP_LAYOUTS = [
  ["tree-1", 230, 490, 0.42, 120, 72, 110, 174],
  ["tree-1", 1275, 705, 0.42, 120, 72, 110, 174],
  ["tree-1", 1290, 460, 0.36, 120, 72, 110, 174],
  ["tree-1", 180, 250, 0.35, 120, 72, 110, 174],
  ["tree-1", 520, 120, 0.33, 120, 72, 110, 174],
  ["rock-2", 1120, 250, 1.1, 44, 26, 10, 30],
  ["rock-2", 300, 790, 1, 44, 26, 10, 30],
  ["rock-2", 1180, 770, 1.18, 44, 26, 10, 30],
  ["rock-2", 1245, 370, 1, 44, 26, 10, 30],
  ["rock-2", 400, 210, 1.15, 44, 26, 10, 30],
  ["rock-2", 650, 235, 1.05, 44, 26, 10, 30],
] as const;

export const ANIMATION_CONFIGS = [
  ["warrior-idle", "warrior-idle", 0, 7, 10, -1],
  ["warrior-run", "warrior-run", 0, 5, 12, -1],
  ["warrior-attack", "warrior-attack", 0, 3, 14, 0],
  ["monk-idle", "monk-idle", 0, 5, 7, -1],
  ["pawn-idle-red", "pawn-idle-red", 0, 7, 9, -1],
  ["pawn-run-red", "pawn-run-red", 0, 5, 11, -1],
  ["archer-idle-red", "archer-idle-red", 0, 7, 9, -1],
  ["archer-run-red", "archer-run-red", 0, 5, 11, -1],
] as const;
