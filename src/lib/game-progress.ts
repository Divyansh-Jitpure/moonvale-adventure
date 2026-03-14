export type QuestStage =
  | "available"
  | "accepted"
  | "scout_defeated"
  | "reward_collected"
  | "completed"
  | "second_route_available"
  | "second_route_active"
  | "archer_defeated"
  | "route_relic_collected"
  | "second_route_completed"
  | "wider_grove_available"
  | "wider_grove_active"
  | "wider_grove_completed"
  | "watch_hollow_available"
  | "watch_hollow_active"
  | "watch_hollow_completed";

export type GameArea = "outpost" | "wider_grove" | "watch_hollow";

export type GameProgress = {
  playerHealth: number;
  stamina: number;
  questStage: QuestStage;
  currentArea: GameArea;
  inventory: {
    goldToken: number;
    arrowSigil: number;
  };
};

export const GAME_PROGRESS_STORAGE_KEY = "moonvale-progress";
export const GAME_PROGRESS_EVENT = "moonvale-progress-updated";

export const defaultGameProgress: GameProgress = {
  playerHealth: 100,
  stamina: 72,
  questStage: "available",
  currentArea: "outpost",
  inventory: {
    goldToken: 0,
    arrowSigil: 0,
  },
};

export function readGameProgress(raw?: string | null): GameProgress {
  if (!raw) {
    return defaultGameProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameProgress>;

    return normalizeProgress({
      playerHealth: clampPlayerHealth(
        parsed.playerHealth ?? defaultGameProgress.playerHealth,
      ),
      stamina: parsed.stamina ?? defaultGameProgress.stamina,
      questStage: parsed.questStage ?? defaultGameProgress.questStage,
      currentArea: parsed.currentArea ?? defaultGameProgress.currentArea,
      inventory: {
        goldToken:
          parsed.inventory?.goldToken ?? defaultGameProgress.inventory.goldToken,
        arrowSigil:
          parsed.inventory?.arrowSigil ?? defaultGameProgress.inventory.arrowSigil,
      },
    });
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

function clampPlayerHealth(value: number) {
  return Math.min(100, Math.max(10, value));
}

function normalizeProgress(progress: GameProgress): GameProgress {
  let questStage = progress.questStage;

  if (progress.inventory.goldToken > 0 && questStage === "scout_defeated") {
    questStage = "reward_collected";
  }

  if (progress.inventory.arrowSigil > 0 && questStage === "archer_defeated") {
    questStage = "route_relic_collected";
  }

  return {
    ...progress,
    questStage,
  };
}
