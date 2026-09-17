import type { SupportLevel } from "./active-support.js";
import type { EngagementMode } from "./engagement-mode.js";
import type { LearningSummary } from "./outcome-learning.js";

export type EvidenceBasis =
  | "direct-observation"
  | "human-statement"
  | "historical-signal"
  | "derived-measure"
  | "system-rule";

export interface TraceEvidence {
  label: string;
  basis: EvidenceBasis;
  confidence: number; // 0-1
  source?: string;
}

export interface DecisionTraceContext {
  evidence?: TraceEvidence[];
  inferences?: string[];
  unknowns?: string[];
  humanReviewRequired?: boolean;
}

export interface DecisionTraceInput {
  supportLevel: SupportLevel;
  strategy: string;
  engagementMode: EngagementMode;
  learning: LearningSummary;
  context?: DecisionTraceContext;
}

export interface DecisionTrace {
  summary: string;
  evidence: TraceEvidence[];
  inferences: string[];
  unknowns: string[];
  humanReviewRequired: boolean;
  exposesPrivateReasoning: false;
  automaticAuthorityChange: false;
}

function boundedConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function cleanText(values: string[] = []): string[] {
  return values.map((value) => value.trim()).filter(Boolean).slice(0, 20);
}

export function buildDecisionTrace(input: DecisionTraceInput): DecisionTrace {
  const context = input.context ?? {};
  const evidence = (context.evidence ?? [])
    .filter((item) => item.label.trim().length > 0)
    .slice(0, 20)
    .map((item) => ({
      ...item,
      label: item.label.trim(),
      confidence: boundedConfidence(item.confidence)
    }));

  return {
    summary:
      `Support ${input.supportLevel}; strategy ${input.strategy}; ` +
      `engagement ${input.engagementMode}; learning ${input.learning.advisory}.`,
    evidence,
    inferences: cleanText(context.inferences),
    unknowns: cleanText(context.unknowns),
    humanReviewRequired:
      Boolean(context.humanReviewRequired) ||
      input.learning.strongerControlRequiresHumanReview,
    exposesPrivateReasoning: false,
    automaticAuthorityChange: false
  };
}
