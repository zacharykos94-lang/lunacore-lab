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

function uniqueReportsByParticipant(reports: CouncilReport[]): {
  counted: CouncilReport[];
  duplicates: CouncilReport[];
  duplicateParticipantIds: string[];
} {
  const seen = new Set<string>();
  const counted: CouncilReport[] = [];
  const duplicates: CouncilReport[] = [];
  const duplicateParticipantIds = new Set<string>();

  for (const report of reports) {
    if (seen.has(report.participantId)) {
      duplicates.push(report);
      duplicateParticipantIds.add(report.participantId);
      continue;
    }

    seen.add(report.participantId);
    counted.push(report);
  }

  return {
    counted,
    duplicates,
    duplicateParticipantIds: [...duplicateParticipantIds]
  };
}

export function synthesizeCouncil(
  taskId: string,
  reports: CouncilReport[],
  humanDecision?: HumanCouncilDecision
): CouncilSynthesis {
  const normalized = reports.map(normalizeReport);
  const unique = uniqueReportsByParticipant(normalized);
  const recommendationGroups = new Map<string, CouncilReport[]>();

  for (const report of unique.counted) {
    const group = recommendationGroups.get(report.recommendation) ?? [];
    group.push(report);
    recommendationGroups.set(report.recommendation, group);
  }

  const ordered = [...recommendationGroups.entries()].sort(
    (a, b) => b[1].length - a[1].length
  );
  const pluralityRecommendation = ordered[0]?.[0];
  const agreements =
    unique.counted.length > 0 && ordered.length === 1
      ? [unique.counted[0].recommendation]
      : [];
  const disagreements =
    ordered.length > 1 ? ordered.map(([recommendation]) => recommendation) : [];
  const minorityReports = pluralityRecommendation
    ? unique.counted.filter(
        (report) => report.recommendation !== pluralityRecommendation
      )
    : [];

  const rejected = humanDecision?.rejected === true || humanDecision?.approved === false;
  const authorized = humanDecision?.approved === true && !rejected;
  const duplicateWarning = unique.duplicateParticipantIds.length > 0
    ? ` Duplicate submissions from ${unique.duplicateParticipantIds.join(", ")} were preserved for review but did not receive additional voting weight.`
    : "";

  return {
    taskId,
    reports: unique.counted,
    duplicateParticipantReports: unique.duplicates,
    duplicateParticipantIds: unique.duplicateParticipantIds,
    agreements,
    disagreements,
    minorityReports,
    humanReviewRequired: true,
    consequentialActionAuthorized: authorized,
    consensusIsAuthority: false,
    reason: (authorized
      ? "The human explicitly approved the consequential next step; council agreement itself did not authorize it."
      : rejected
        ? "The human rejected the consequential next step; council agreement cannot override that rejection."
        : "Council output is advisory and returns to a human for consequential authorization.") + duplicateWarning
  };
}
