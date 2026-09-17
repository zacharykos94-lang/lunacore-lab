import type { SupportLevel } from "./active-support.js";

export type EngagementIntent =
  | "action"
  | "creative"
  | "leisure"
  | "presence"
  | "observe";

export type EngagementMode =
  | "action"
  | "creative-exploration"
  | "leisure"
  | "presence"
  | "strategic-stillness";

export interface EngagementContext {
  intent?: EngagementIntent;
  explicitActionRequested?: boolean;
  observationValue?: number; // 0-1
  timeSensitivity?: number; // 0-1
}

export interface EngagementDecisionInput extends EngagementContext {
  supportLevel: SupportLevel;
}

function bounded(value: number | undefined): number {
  if (value === undefined) return 0;
  return Math.max(0, Math.min(1, value));
}

export function chooseEngagementMode(
  input: EngagementDecisionInput
): EngagementMode {
  const observationValue = bounded(input.observationValue);
  const timeSensitivity = bounded(input.timeSensitivity);

  // Strong support levels justify active engagement even when the
  // preferred mode is rest, leisure, or observation.
  if (
    input.supportLevel === "safety-support" ||
    input.supportLevel === "active-support"
  ) {
    return "action";
  }

  if (input.explicitActionRequested || timeSensitivity >= 0.75) {
    return "action";
  }

  switch (input.intent) {
    case "creative":
      return "creative-exploration";
    case "leisure":
      return "leisure";
    case "presence":
      return "presence";
    case "observe":
      return observationValue >= 0.5
        ? "strategic-stillness"
        : "presence";
    case "action":
      return "action";
    default:
      return observationValue >= 0.75
        ? "strategic-stillness"
        : "presence";
  }
}
