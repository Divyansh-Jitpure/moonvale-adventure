import {
  defaultGameProgress,
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  saveGameProgress,
  type GameArea,
  type GameProgress,
  type QuestStage,
} from "@/lib/game-progress";
import {
  ARCHER_ACTIVE_STAGES,
  ARCHER_CLEARED_STAGES,
  ARCHER_ROUTE_STAGES,
  GOLD_HIDDEN_STAGES,
  getQuestStageDetails,
  SCOUT_RESOLVED_STAGES,
  SIGIL_HIDDEN_STAGES,
  WATCH_HOLLOW_STAGES,
  WIDER_GROVE_STAGES,
} from "@/lib/quest-data";

export { getDialogueResolvedStage, getDialogueStartStage } from "@/lib/quest-data";

export const DEFAULT_HINT =
  "Brother Alden guards the route ledger. Speak with him to begin.";

export function readStoredProgress(storage: Storage): GameProgress {
  return readGameProgress(storage.getItem(GAME_PROGRESS_STORAGE_KEY));
}

export function saveStoredProgress(progress: GameProgress) {
  saveGameProgress(progress);
}

export function buildStoredProgress(input: {
  playerHealth: number;
  questStage: QuestStage;
  currentArea: GameArea;
  inventoryGold: number;
  inventorySigil: number;
}): GameProgress {
  return {
    playerHealth: input.playerHealth,
    stamina: defaultGameProgress.stamina,
    questStage: input.questStage,
    currentArea: input.currentArea,
    inventory: {
      goldToken: input.inventoryGold,
      arrowSigil: input.inventorySigil,
    },
  };
}

export function isScoutResolved(stage: QuestStage) {
  return SCOUT_RESOLVED_STAGES.includes(stage);
}

export function hasArcherRoute(stage: QuestStage) {
  return ARCHER_ROUTE_STAGES.includes(stage);
}

export function shouldActivateArcher(stage: QuestStage) {
  return ARCHER_ACTIVE_STAGES.includes(stage);
}

export function shouldDisableArcher(stage: QuestStage) {
  return ARCHER_CLEARED_STAGES.includes(stage);
}

export function shouldHideGoldReward(stage: QuestStage) {
  return GOLD_HIDDEN_STAGES.includes(stage);
}

export function shouldHideSigilReward(stage: QuestStage) {
  return SIGIL_HIDDEN_STAGES.includes(stage);
}

export function hasWiderGroveRoute(stage: QuestStage) {
  return WIDER_GROVE_STAGES.includes(stage);
}

export function hasWatchHollowRoute(stage: QuestStage) {
  return WATCH_HOLLOW_STAGES.includes(stage);
}

export function getHintForStage(stage: QuestStage) {
  return getQuestStageDetails(stage).hint;
}
