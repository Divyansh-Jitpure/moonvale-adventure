import type { QuestStage } from "@/lib/game-progress";

export type InputState = {
  x: number;
  y: number;
  sprint: boolean;
  attack: boolean;
  interact: boolean;
};

export type DialogueState = {
  label: string;
  lines: string[];
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

export const DIALOGUE: Record<QuestStage, DialogueState> = {
  available: {
    label: "Brother Alden",
    lines: ["The pond road is unsafe.", "Drive off the red scout and bring me its token."],
  },
  accepted: {
    label: "Brother Alden",
    lines: ["The scout is still near the pond.", "Remove it and collect the gold token."],
  },
  scout_defeated: {
    label: "Brother Alden",
    lines: ["I heard steel on the road.", "Pick up the gold token before you return."],
  },
  reward_collected: {
    label: "Brother Alden",
    lines: ["Good. The first route is proven.", "Speak again and I will open the northern stones."],
  },
  completed: {
    label: "Brother Alden",
    lines: ["The first route is recorded.", "The northern stones are next."],
  },
  second_route_available: {
    label: "Brother Alden",
    lines: ["A red archer took the northern stones.", "Push north, defeat it, and recover its sigil."],
  },
  second_route_active: {
    label: "Brother Alden",
    lines: ["The archer won't rush you.", "Keep moving and close the gap."],
  },
  archer_defeated: {
    label: "Brother Alden",
    lines: ["The shots have stopped.", "Find the arrow sigil and bring it back."],
  },
  route_relic_collected: {
    label: "Brother Alden",
    lines: ["That sigil seals the route.", "Hand it over and Moonvale gains a second road."],
  },
  second_route_completed: {
    label: "Brother Alden",
    lines: ["Two routes secured.", "The eastern grove is wider and meaner. I can open it if you are ready."],
  },
  wider_grove_available: {
    label: "Brother Alden",
    lines: ["The eastern gate is open now.", "Cross into the wider grove and break the enemy pack holding the ridge."],
  },
  wider_grove_active: {
    label: "Brother Alden",
    lines: ["You will not find a lone target there.", "A scout presses close while an archer cuts the lane behind it."],
  },
  wider_grove_completed: {
    label: "Brother Alden",
    lines: ["The wider grove route is ours.", "Moonvale can finally breathe beyond the outpost walls."],
  },
};

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
