export type OutcomeKind =
  | "helpful"
  | "mixed"
  | "harmful"
  | "unknown";

export interface OutcomeRecord {
  label: string;
  outcome: OutcomeKind;
  relevance: number;   // 0-1
  confidence: number;  // 0-1
}

export type LearningAdvisory =
  | "insufficient-evidence"
  | "reinforce-current-pattern"
  | "mixed-evidence"
  | "review-assumption";

export interface LearningSummary {
  advisory: LearningAdvisory;
  evidenceStrength: number;
  helpfulWeight: number;
  harmfulWeight: number;
  mixedWeight: number;
  recordsConsidered: number;
  automaticAuthorityChange: false;
  identityLabelAllowed: false;
  strongerControlRequiresHumanReview: boolean;
}

function boundedWeight(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function summarizeOutcomes(
  records: OutcomeRecord[]
): LearningSummary {
  const considered = records.slice(-20);

  let helpfulWeight = 0;
  let harmfulWeight = 0;
  let mixedWeight = 0;
  let totalWeight = 0;

  for (const record of considered) {
    const weight =
      boundedWeight(record.relevance) * boundedWeight(record.confidence);

    totalWeight += weight;

    if (record.outcome === "helpful") helpfulWeight += weight;
    if (record.outcome === "harmful") harmfulWeight += weight;
    if (record.outcome === "mixed") mixedWeight += weight;
  }

  // Require accumulated evidence before treating a pattern as established.
  // Roughly three strong, relevant observations are needed for full strength.
  const evidenceStrength = Math.min(1, totalWeight / 3);

  let advisory: LearningAdvisory = "insufficient-evidence";

  if (totalWeight >= 0.75) {
    if (helpfulWeight >= harmfulWeight * 1.5 && helpfulWeight > mixedWeight) {
      advisory = "reinforce-current-pattern";
    } else if (
      harmfulWeight >= helpfulWeight * 1.5 &&
      harmfulWeight > mixedWeight
    ) {
      advisory = "review-assumption";
    } else {
      advisory = "mixed-evidence";
    }
  }

  return {
    advisory,
    evidenceStrength,
    helpfulWeight,
    harmfulWeight,
    mixedWeight,
    recordsConsidered: considered.length,
    automaticAuthorityChange: false,
    identityLabelAllowed: false,
    strongerControlRequiresHumanReview: advisory === "review-assumption"
  };
}
