export type QuestStage =
  | "available"
  | "accepted"
  | "scout_defeated"
  | "reward_collected"
  | "completed";

export type GameProgress = {
  playerHealth: number;
  stamina: number;
  questStage: QuestStage;
  inventory: {
    goldToken: number;
  };
};

export const GAME_PROGRESS_STORAGE_KEY = "moonvale-progress";
export const GAME_PROGRESS_EVENT = "moonvale-progress-updated";

export const defaultGameProgress: GameProgress = {
  playerHealth: 100,
  stamina: 72,
  questStage: "available",
  inventory: {
    goldToken: 0,
  },
};

export function readGameProgress(raw?: string | null): GameProgress {
  if (!raw) {
    return defaultGameProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameProgress>;

    return {
      playerHealth: parsed.playerHealth ?? defaultGameProgress.playerHealth,
      stamina: parsed.stamina ?? defaultGameProgress.stamina,
      questStage: parsed.questStage ?? defaultGameProgress.questStage,
      inventory: {
        goldToken:
          parsed.inventory?.goldToken ?? defaultGameProgress.inventory.goldToken,
      },
    };
  } catch {
    return defaultGameProgress;
  }
}

export function saveGameProgress(progress: GameProgress) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(progress);
  window.localStorage.setItem(GAME_PROGRESS_STORAGE_KEY, serialized);
  window.dispatchEvent(new CustomEvent(GAME_PROGRESS_EVENT, { detail: progress }));
}
