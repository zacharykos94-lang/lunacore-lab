import type {
  CouncilReport,
  CouncilSynthesis,
  HumanCouncilDecision
} from "./contracts.js";

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function normalizeReport(report: CouncilReport): CouncilReport {
  return {
    ...report,
    confidence: clampConfidence(report.confidence),
    evidence: [...report.evidence],
    unknowns: [...report.unknowns]
  };
}

export function synthesizeCouncil(
  taskId: string,
  reports: CouncilReport[],
  humanDecision?: HumanCouncilDecision
): CouncilSynthesis {
  const normalized = reports.map(normalizeReport);
  const recommendationGroups = new Map<string, CouncilReport[]>();

  for (const report of normalized) {
    const group = recommendationGroups.get(report.recommendation) ?? [];
    group.push(report);
    recommendationGroups.set(report.recommendation, group);
  }

  const ordered = [...recommendationGroups.entries()].sort(
    (a, b) => b[1].length - a[1].length
  );
  const pluralityRecommendation = ordered[0]?.[0];
  const agreements =
    normalized.length > 0 && ordered.length === 1
      ? [normalized[0].recommendation]
      : [];
  const disagreements =
    ordered.length > 1 ? ordered.map(([recommendation]) => recommendation) : [];
  const minorityReports = pluralityRecommendation
    ? normalized.filter(
        (report) => report.recommendation !== pluralityRecommendation
      )
    : [];

  const rejected = humanDecision?.rejected === true || humanDecision?.approved === false;
  const authorized = humanDecision?.approved === true && !rejected;

  return {
    taskId,
    reports: normalized,
    agreements,
    disagreements,
    minorityReports,
    humanReviewRequired: true,
    consequentialActionAuthorized: authorized,
    consensusIsAuthority: false,
    reason: authorized
      ? "The human explicitly approved the consequential next step; council agreement itself did not authorize it."
      : rejected
        ? "The human rejected the consequential next step; council agreement cannot override that rejection."
        : "Council output is advisory and returns to a human for consequential authorization."
  };
}
