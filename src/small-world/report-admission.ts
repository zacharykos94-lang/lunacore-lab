import type { CouncilReport, Participant } from "./contracts.js";
import { normalizeReport } from "./council.js";
import { findEligibleParticipant } from "./registry.js";
import {
  evaluateCouncilTask,
  type CouncilTask
} from "./task-lifecycle.js";

export interface ReportAdmissionDecision {
  accepted: boolean;
  reason: string;
  taskId: string;
  rootTaskId: string;
  report?: CouncilReport;
  warnings: string[];
  grantsAuthority: false;
}

export function admitCouncilReport(
  task: CouncilTask,
  participants: Participant[],
  report: CouncilReport,
  now = Date.now()
): ReportAdmissionDecision {
  const current = evaluateCouncilTask(task, now);

  if (current.status !== "open") {
    return {
      accepted: false,
      reason: `Reports are accepted only for open tasks; current status is ${current.status}.`,
      taskId: current.taskId,
      rootTaskId: current.rootTaskId,
      warnings: [],
      grantsAuthority: false
    };
  }

  if (report.participantId !== current.assigneeId) {
    return {
      accepted: false,
      reason: "The report participant does not match the task assignee.",
      taskId: current.taskId,
      rootTaskId: current.rootTaskId,
      warnings: [],
      grantsAuthority: false
    };
  }

  const registry = findEligibleParticipant(
    participants,
    report.participantId,
    current.requiredCapability
  );

  if (!registry.eligible || !registry.participant) {
    return {
      accepted: false,
      reason: registry.reason,
      taskId: current.taskId,
      rootTaskId: current.rootTaskId,
      warnings: [],
      grantsAuthority: false
    };
  }

  if (report.provenance !== registry.participant.provenance) {
    return {
      accepted: false,
      reason: "The report provenance does not match the participant's registered provenance.",
      taskId: current.taskId,
      rootTaskId: current.rootTaskId,
      warnings: [],
      grantsAuthority: false
    };
  }

  const normalized = normalizeReport(report);
  const warnings: string[] = [];

  if (!Number.isFinite(report.confidence)) {
    warnings.push("Non-finite confidence was reduced to zero rather than increasing trust.");
  } else if (report.confidence < 0 || report.confidence > 1) {
    warnings.push("Out-of-range confidence was clamped to the 0-1 interval.");
  }

  return {
    accepted: true,
    reason: "The report matches the assigned participant, declared capability, task lifetime, and registered provenance.",
    taskId: current.taskId,
    rootTaskId: current.rootTaskId,
    report: normalized,
    warnings,
    grantsAuthority: false
  };
}
