import {
  defaultGameProgress,
  GAME_PROGRESS_STORAGE_KEY,
  readGameProgress,
  saveGameProgress,
  type GameArea,
  type GameProgress,
  type QuestStage,
} from "@/lib/game-progress";

export const DEFAULT_HINT =
  "Brother Alden guards the route ledger. Speak with him to begin.";

const SCOUT_RESOLVED_STAGES: QuestStage[] = [
  "scout_defeated",
  "reward_collected",
  "completed",
  "second_route_available",
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
];

const ARCHER_ROUTE_STAGES: QuestStage[] = [
  "second_route_available",
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
];

const WIDER_GROVE_STAGES: QuestStage[] = [
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
];

const ARCHER_ACTIVE_STAGES: QuestStage[] = [
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
];

const ARCHER_CLEARED_STAGES: QuestStage[] = [
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
];

const GOLD_HIDDEN_STAGES: QuestStage[] = [
  "reward_collected",
  "completed",
  "second_route_available",
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
];

const SIGIL_HIDDEN_STAGES: QuestStage[] = [
  "route_relic_collected",
  "second_route_completed",
];

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

export function getDialogueStartStage(stage: QuestStage): QuestStage {
  switch (stage) {
    case "available":
      return "accepted";
    case "completed":
      return "second_route_available";
    case "second_route_available":
      return "second_route_active";
    case "second_route_completed":
      return "wider_grove_available";
    case "wider_grove_available":
      return "wider_grove_active";
    default:
      return stage;
  }
}

export function getDialogueResolvedStage(stage: QuestStage): QuestStage {
  switch (stage) {
    case "reward_collected":
      return "completed";
    case "route_relic_collected":
      return "second_route_completed";
    default:
      return stage;
  }
}

export function getHintForStage(stage: QuestStage) {
  switch (stage) {
    case "available":
    case "accepted":
      return "Brother Alden wants the pond road scout removed.";
    case "scout_defeated":
      return "Scout defeated. Pick up the gold token.";
    case "reward_collected":
      return "Gold recovered. Return to Alden for route clearance.";
    case "completed":
      return "First route secured. Speak to Alden again for the northern stones.";
    case "second_route_available":
      return "Alden can now open the northern stones route.";
    case "second_route_active":
      return "Second route live. Defeat the red archer in the north.";
    case "archer_defeated":
      return "Archer down. Recover the arrow sigil.";
    case "route_relic_collected":
      return "Sigil secured. Return to Alden to close the route.";
    case "second_route_completed":
      return "Two routes secured. Speak to Alden to open the wider grove.";
    case "wider_grove_available":
      return "The eastern grove gate is open. Travel out and clear the deeper route.";
    case "wider_grove_active":
      return "Wider grove live. Break the enemy pack and secure the eastern path.";
    case "wider_grove_completed":
      return "Wider grove secured. Moonvale now holds a larger frontier.";
    default:
      return "Moonvale route ledger active.";
  }
}
