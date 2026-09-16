import {
  chooseSupport,
  type SupportContext,
  type SupportDecision
} from "./active-support.js";

import {
  contextWeight,
  type ContextSnapshot
} from "./context.js";

import {
  purposeWeight,
  type PurposeSnapshot
} from "./purpose.js";

export type AdaptiveStrategy =
  | "presence-led"
  | "purpose-led"
  | "context-aware"
  | "context-and-purpose";

export interface AdaptiveSupportInput {
  risk: SupportContext;
  context: ContextSnapshot;
  purpose: PurposeSnapshot;
}

export interface AdaptiveSupportDecision extends SupportDecision {
  contextWeight: number;
  purposeWeight: number;
  strategy: AdaptiveStrategy;
  purposeVisible: boolean;
  safetyOverridesPurpose: boolean;
}

export function chooseAdaptiveSupport(
  input: AdaptiveSupportInput
): AdaptiveSupportDecision {
  const base = chooseSupport(input.risk);
  const history = contextWeight(input.context);
  const purpose = purposeWeight(input.purpose);

  let strategy: AdaptiveStrategy = "presence-led";

  if (history >= 0.4 && purpose >= 0.4) {
    strategy = "context-and-purpose";
  } else if (purpose >= 0.4) {
    strategy = "purpose-led";
  } else if (history >= 0.4) {
    strategy = "context-aware";
  }

  return {
    ...base,
    contextWeight: history,
    purposeWeight: purpose,
    strategy,
    purposeVisible: Boolean(input.purpose.statedPurpose),
    safetyOverridesPurpose: base.level === "safety-support"
  };
}