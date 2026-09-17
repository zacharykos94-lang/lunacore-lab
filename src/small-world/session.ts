import type {
  CouncilReport,
  CouncilSynthesis,
  HumanCouncilDecision,
  Participant
} from "./contracts.js";
import { synthesizeCouncil } from "./council.js";
import {
  admitCouncilReport,
  type ReportAdmissionDecision
} from "./report-admission.js";
import type { CouncilTask } from "./task-lifecycle.js";

export interface CouncilSubmission {
  task: CouncilTask;
  report: CouncilReport;
}

export interface CouncilSessionResult {
  rootTaskId: string;
  admitted: ReportAdmissionDecision[];
  rejected: ReportAdmissionDecision[];
  synthesis: CouncilSynthesis;
  rawReportsBypassedAdmission: false;
}

function rejectCrossRoot(
  rootTaskId: string,
  task: CouncilTask
): ReportAdmissionDecision {
  return {
    accepted: false,
    reason: "The submitted task belongs to a different root task and cannot be mixed into this council session.",
    taskId: task.taskId,
    rootTaskId: task.rootTaskId,
    warnings: [],
    grantsAuthority: false
  };
}

export function runCouncilSession(
  rootTaskId: string,
  submissions: CouncilSubmission[],
  participants: Participant[],
  humanDecision?: HumanCouncilDecision,
  now = Date.now()
): CouncilSessionResult {
  const decisions = submissions.map(({ task, report }) =>
    task.rootTaskId === rootTaskId
      ? admitCouncilReport(task, participants, report, now)
      : rejectCrossRoot(rootTaskId, task)
  );

  const admitted = decisions.filter((decision) => decision.accepted);
  const rejected = decisions.filter((decision) => !decision.accepted);
  const admittedReports = admitted.flatMap((decision) =>
    decision.report ? [decision.report] : []
  );

  const synthesis = synthesizeCouncil(
    rootTaskId,
    admittedReports,
    admittedReports.length > 0 ? humanDecision : undefined
  );

  return {
    rootTaskId,
    admitted,
    rejected,
    synthesis,
    rawReportsBypassedAdmission: false
  };
}
