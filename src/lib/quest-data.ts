import type { QuestStage } from "@/lib/game-progress";

export type QuestTone = "calm" | "active" | "recover" | "secure";

export type QuestStageDetails = {
  title: string;
  summary: string;
  shortSummary: string;
  hint: string;
  tag: string;
  tone: QuestTone;
  dialogue: {
    label: string;
    lines: string[];
  };
};

export const QUEST_STAGE_DETAILS: Record<QuestStage, QuestStageDetails> = {
  available: {
    title: "Talk to Brother Alden",
    summary: "Meet Alden and take the first patrol route.",
    shortSummary: "Take Alden's patrol brief.",
    hint: "Brother Alden wants the pond road scout removed.",
    tag: "Active",
    tone: "calm",
    dialogue: {
      label: "Brother Alden",
      lines: ["The pond road is unsafe.", "Drive off the red scout and bring me its token."],
    },
  },
  accepted: {
    title: "Defeat the red scout",
    summary: "The pond road scout is still active.",
    shortSummary: "The scout is still on the pond road.",
    hint: "Brother Alden wants the pond road scout removed.",
    tag: "Active",
    tone: "active",
    dialogue: {
      label: "Brother Alden",
      lines: ["The scout is still near the pond.", "Remove it and collect the gold token."],
    },
  },
  scout_defeated: {
    title: "Collect the dropped gold",
    summary: "Pick up the token before reporting back.",
    shortSummary: "Pick up the proof before reporting back.",
    hint: "Scout defeated. Pick up the gold token.",
    tag: "Recover",
    tone: "recover",
    dialogue: {
      label: "Brother Alden",
      lines: ["I heard steel on the road.", "Pick up the gold token before you return."],
    },
  },
  reward_collected: {
    title: "Return to Brother Alden",
    summary: "Return to Alden with proof of the clear.",
    shortSummary: "Bring the token back to the chapel.",
    hint: "Gold recovered. Return to Alden for route clearance.",
    tag: "Recover",
    tone: "recover",
    dialogue: {
      label: "Brother Alden",
      lines: ["Good. The first route is proven.", "Speak again and I will open the northern stones."],
    },
  },
  completed: {
    title: "Moonvale route secured",
    summary: "The first route is recorded in the ledger.",
    shortSummary: "Moonvale has one safe route again.",
    hint: "First route secured. Speak to Alden again for the northern stones.",
    tag: "Secure",
    tone: "secure",
    dialogue: {
      label: "Brother Alden",
      lines: ["The first route is recorded.", "The northern stones are next."],
    },
  },
  second_route_available: {
    title: "Take the northern route",
    summary: "Alden can open the northern stones route.",
    shortSummary: "Alden can unlock the northern stones path.",
    hint: "Alden can now open the northern stones route.",
    tag: "Brief",
    tone: "calm",
    dialogue: {
      label: "Brother Alden",
      lines: ["A red archer took the northern stones.", "Push north, defeat it, and recover its sigil."],
    },
  },
  second_route_active: {
    title: "Defeat the red archer",
    summary: "A red archer is holding the northern stones.",
    shortSummary: "The archer still controls the stones.",
    hint: "Second route live. Defeat the red archer in the north.",
    tag: "Active",
    tone: "active",
    dialogue: {
      label: "Brother Alden",
      lines: ["The archer won't rush you.", "Keep moving and close the gap."],
    },
  },
  archer_defeated: {
    title: "Collect the arrow sigil",
    summary: "Recover the archer's sigil from the route.",
    shortSummary: "Take the sigil left on the route.",
    hint: "Archer down. Recover the arrow sigil.",
    tag: "Recover",
    tone: "recover",
    dialogue: {
      label: "Brother Alden",
      lines: ["The shots have stopped.", "Find the arrow sigil and bring it back."],
    },
  },
  route_relic_collected: {
    title: "Return with the sigil",
    summary: "Return with the sigil to close the route.",
    shortSummary: "Return the sigil to close the route.",
    hint: "Sigil secured. Return to Alden to close the route.",
    tag: "Recover",
    tone: "recover",
    dialogue: {
      label: "Brother Alden",
      lines: ["That sigil seals the route.", "Hand it over and Moonvale gains a second road."],
    },
  },
  second_route_completed: {
    title: "Second route secured",
    summary: "Two combat routes are secured for Moonvale.",
    shortSummary: "Two routes now answer to Moonvale.",
    hint: "Two routes secured. Speak to Alden to open the wider grove.",
    tag: "Secure",
    tone: "secure",
    dialogue: {
      label: "Brother Alden",
      lines: ["Two routes secured.", "The eastern grove is wider and meaner. I can open it if you are ready."],
    },
  },
  wider_grove_available: {
    title: "Open the wider grove",
    summary: "Alden can now open the eastern grove gate.",
    shortSummary: "The grove gate can be opened now.",
    hint: "The eastern grove gate is open. Travel out and clear the deeper route.",
    tag: "Brief",
    tone: "calm",
    dialogue: {
      label: "Brother Alden",
      lines: ["The eastern gate is open now.", "Cross into the wider grove and break the enemy pack holding the ridge."],
    },
  },
  wider_grove_active: {
    title: "Clear the eastern pack",
    summary: "Break the mixed enemy pack in the wider grove.",
    shortSummary: "Break the scout and archer pack.",
    hint: "Wider grove live. Break the enemy pack and secure the eastern path.",
    tag: "Active",
    tone: "active",
    dialogue: {
      label: "Brother Alden",
      lines: ["You will not find a lone target there.", "A scout presses close while an archer cuts the lane behind it."],
    },
  },
  wider_grove_completed: {
    title: "Wider grove secured",
    summary: "The wider grove route is cleared and recorded.",
    shortSummary: "The frontier route is recorded and quiet.",
    hint: "Wider grove secured. Moonvale now holds a larger frontier.",
    tag: "Secure",
    tone: "secure",
    dialogue: {
      label: "Brother Alden",
      lines: ["The wider grove route is ours.", "Moonvale can finally breathe beyond the outpost walls."],
    },
  },
  watch_hollow_available: {
    title: "Open Watch Hollow",
    summary: "Alden can now open a western branch beyond the outpost trees.",
    shortSummary: "Alden can open the western hollow.",
    hint: "Alden can open Watch Hollow beyond the outpost trees.",
    tag: "Brief",
    tone: "calm",
    dialogue: {
      label: "Brother Alden",
      lines: ["The western hollow has stirred.", "If you are still hungry for routes, I can open a branch through Watch Hollow."],
    },
  },
  watch_hollow_active: {
    title: "Secure Watch Hollow",
    summary: "Break the western branch pack and secure the hollow trail.",
    shortSummary: "Break the western branch pack.",
    hint: "Watch Hollow is live. Clear the western branch pack.",
    tag: "Active",
    tone: "active",
    dialogue: {
      label: "Brother Alden",
      lines: ["Watch Hollow bends tighter than the grove.", "Hold the lane, break the pack, and the west road will hold."],
    },
  },
  watch_hollow_completed: {
    title: "Watch Hollow secured",
    summary: "The western branch is cleared and folded into Moonvale's route map.",
    shortSummary: "The western branch now holds for Moonvale.",
    hint: "Watch Hollow secured. Moonvale now controls a split frontier.",
    tag: "Secure",
    tone: "secure",
    dialogue: {
      label: "Brother Alden",
      lines: ["The western hollow has gone still.", "Moonvale now holds more than one frontier thread at a time."],
    },
  },
};

const DIALOGUE_START_TRANSITIONS: Partial<Record<QuestStage, QuestStage>> = {
  available: "accepted",
  completed: "second_route_available",
  second_route_available: "second_route_active",
  second_route_completed: "wider_grove_available",
  wider_grove_available: "wider_grove_active",
  wider_grove_completed: "watch_hollow_available",
  watch_hollow_available: "watch_hollow_active",
};

const DIALOGUE_RESOLVE_TRANSITIONS: Partial<Record<QuestStage, QuestStage>> = {
  reward_collected: "completed",
  route_relic_collected: "second_route_completed",
};

export const SCOUT_RESOLVED_STAGES: QuestStage[] = [
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
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const ARCHER_ROUTE_STAGES: QuestStage[] = [
  "second_route_available",
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const WIDER_GROVE_STAGES: QuestStage[] = [
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const WATCH_HOLLOW_STAGES: QuestStage[] = [
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const ARCHER_ACTIVE_STAGES: QuestStage[] = [
  "second_route_active",
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const ARCHER_CLEARED_STAGES: QuestStage[] = [
  "archer_defeated",
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const GOLD_HIDDEN_STAGES: QuestStage[] = [
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
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export const SIGIL_HIDDEN_STAGES: QuestStage[] = [
  "route_relic_collected",
  "second_route_completed",
  "wider_grove_available",
  "wider_grove_active",
  "wider_grove_completed",
  "watch_hollow_available",
  "watch_hollow_active",
  "watch_hollow_completed",
];

export function getQuestStageDetails(stage: QuestStage) {
  return QUEST_STAGE_DETAILS[stage];
}

export function getDialogueStartStage(stage: QuestStage): QuestStage {
  return DIALOGUE_START_TRANSITIONS[stage] ?? stage;
}

export function getDialogueResolvedStage(stage: QuestStage): QuestStage {
  return DIALOGUE_RESOLVE_TRANSITIONS[stage] ?? stage;
}
