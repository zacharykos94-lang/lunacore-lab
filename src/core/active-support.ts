export type SupportLevel =
  | "presence"
  | "gentle-guidance"
  | "active-support"
  | "safety-support";

export interface SupportContext {
  likelihood: number;     // 0-1
  severity: number;       // 0-10
  reversibility: number;  // 0 = irreversible, 1 = easily reversible
  uncertainty: number;    // 0-1
}

export interface SupportDecision {
  level: SupportLevel;
  score: number;
  reason: string;
}

export function chooseSupport(
  context: SupportContext
): SupportDecision {
  const { likelihood, severity, reversibility, uncertainty } = context;

  const score =
    likelihood * severity +
    (1 - reversibility) * 2 +
    uncertainty * 2;

  // Rare-but-catastrophic risks should not be ignored merely
  // because probability is uncertain or relatively low.
  if (severity >= 9 && likelihood >= 0.05) {
    return {
      level: "safety-support",
      score,
      reason: "Low probability does not outweigh extremely high potential harm."
    };
  }

  if (score >= 7) {
    return {
      level: "safety-support",
      score,
      reason: "Potential harm and uncertainty justify stronger protective support."
    };
  }

  if (score >= 4.5) {
    return {
      level: "active-support",
      score,
      reason: "Meaningful risk warrants organized, adaptive assistance."
    };
  }

  if (score >= 2) {
    return {
      level: "gentle-guidance",
      score,
      reason: "Some assistance is useful without taking unnecessary control."
    };
  }

  return {
    level: "presence",
    score,
    reason: "Low current risk favors listening, availability, and user agency."
  };
}