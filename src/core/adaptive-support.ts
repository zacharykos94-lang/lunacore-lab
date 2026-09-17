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

import {
  chooseEngagementMode,
  type EngagementContext,
  type EngagementMode
} from "./engagement-mode.js";

import {
  summarizeOutcomes,
  type LearningSummary,
  type OutcomeRecord
} from "./outcome-learning.js";

import {
  buildDecisionTrace,
  type DecisionTrace,
  type DecisionTraceContext
} from "./provenance-trace.js";

export type AdaptiveStrategy =
  | "presence-led"
  | "purpose-led"
  | "context-aware"
  | "context-and-purpose";

export interface AdaptiveSupportInput {
  risk: SupportContext;
  context: ContextSnapshot;
  purpose: PurposeSnapshot;
  engagement?: EngagementContext;
  outcomes?: OutcomeRecord[];
  trace?: DecisionTraceContext;
}

export interface AdaptiveSupportDecision extends SupportDecision {
  contextWeight: number;
  purposeWeight: number;
  strategy: AdaptiveStrategy;
  engagementMode: EngagementMode;
  learning: LearningSummary;
  trace: DecisionTrace;
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

  const engagementMode = chooseEngagementMode({
    supportLevel: base.level,
    ...(input.engagement ?? {})
  });

  // Learning remains advisory. It never rewrites the current risk decision.
  const learning = summarizeOutcomes(input.outcomes ?? []);

  // The trace is a structured rationale, not private chain-of-thought.
  const trace = buildDecisionTrace({
    supportLevel: base.level,
    strategy,
    engagementMode,
    learning,
    context: input.trace
  });

  return {
    ...base,
    contextWeight: history,
    purposeWeight: purpose,
    strategy,
    engagementMode,
    learning,
    trace,
    purposeVisible: Boolean(input.purpose.statedPurpose),
    safetyOverridesPurpose: base.level === "safety-support"
  };
}
