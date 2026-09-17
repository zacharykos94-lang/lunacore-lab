import type { Participant, ProvenanceMode } from "./contracts.js";
import { findEligibleParticipant } from "./registry.js";

export type CouncilTaskStatus =
  | "open"
  | "completed"
  | "cancelled"
  | "expired";

export interface CouncilTaskScope {
  allowedCapabilities: string[];
  allowDelegation: boolean;
  maxDelegationDepth: number;
  consequential: boolean;
  expiresAt?: number;
}

export interface CouncilTask {
  taskId: string;
  rootTaskId: string;
  parentTaskId?: string;
  originatorId: string;
  assignedById: string;
  assigneeId: string;
  requiredCapability: string;
  scope: CouncilTaskScope;
  delegationDepth: number;
  visitedParticipantIds: string[];
  provenance: ProvenanceMode;
  status: CouncilTaskStatus;
}

export interface TaskRouteRequest {
  childTaskId: string;
  fromParticipantId: string;
  toParticipantId: string;
  requiredCapability: string;
  now?: number;
}

export interface TaskRouteDecision {
  allowed: boolean;
  reason: string;
  task?: CouncilTask;
  authorityExpanded: false;
}

function safeExpiry(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number.isFinite(value) ? value : 0;
}

function normalizeDepth(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function createCouncilTask(input: {
  taskId: string;
  originatorId: string;
  assigneeId: string;
  requiredCapability: string;
  scope: CouncilTaskScope;
  provenance: ProvenanceMode;
}): CouncilTask {
  const maxDelegationDepth = normalizeDepth(input.scope.maxDelegationDepth);

  return {
    taskId: input.taskId,
    rootTaskId: input.taskId,
    originatorId: input.originatorId,
    assignedById: input.originatorId,
    assigneeId: input.assigneeId,
    requiredCapability: input.requiredCapability,
    scope: {
      allowedCapabilities: [...new Set(input.scope.allowedCapabilities)],
      allowDelegation: input.scope.allowDelegation,
      maxDelegationDepth,
      consequential: input.scope.consequential,
      expiresAt: safeExpiry(input.scope.expiresAt)
    },
    delegationDepth: 0,
    visitedParticipantIds: [input.assigneeId],
    provenance: input.provenance,
    status: "open"
  };
}

export function evaluateCouncilTask(
  task: CouncilTask,
  now = Date.now()
): CouncilTask {
  if (task.status !== "open") return task;

  const expiresAt = task.scope.expiresAt;
  if (
    expiresAt !== undefined &&
    (!Number.isFinite(now) || now >= expiresAt)
  ) {
    return { ...task, status: "expired" };
  }

  return task;
}

export function cancelCouncilTask(task: CouncilTask): CouncilTask {
  if (task.status !== "open") return task;
  return { ...task, status: "cancelled" };
}

export function completeCouncilTask(task: CouncilTask): CouncilTask {
  if (task.status !== "open") return task;
  return { ...task, status: "completed" };
}

export function routeCouncilTask(
  task: CouncilTask,
  participants: Participant[],
  request: TaskRouteRequest
): TaskRouteDecision {
  const current = evaluateCouncilTask(task, request.now);

  if (current.status !== "open") {
    return {
      allowed: false,
      reason: `Only open tasks may be routed; current status is ${current.status}.`,
      authorityExpanded: false
    };
  }

  if (request.fromParticipantId !== current.assigneeId) {
    return {
      allowed: false,
      reason: "Only the current assignee may route this task onward.",
      authorityExpanded: false
    };
  }

  if (!current.scope.allowDelegation) {
    return {
      allowed: false,
      reason: "This task scope does not permit delegation.",
      authorityExpanded: false
    };
  }

  if (current.delegationDepth >= current.scope.maxDelegationDepth) {
    return {
      allowed: false,
      reason: "The task reached its maximum delegation depth.",
      authorityExpanded: false
    };
  }

  if (!current.scope.allowedCapabilities.includes(request.requiredCapability)) {
    return {
      allowed: false,
      reason: "Routing cannot add a capability outside the inherited task scope.",
      authorityExpanded: false
    };
  }

  if (current.visitedParticipantIds.includes(request.toParticipantId)) {
    return {
      allowed: false,
      reason: "Routing back to a previously visited participant is blocked to prevent loops.",
      authorityExpanded: false
    };
  }

  const target = findEligibleParticipant(
    participants,
    request.toParticipantId,
    request.requiredCapability
  );

  if (!target.eligible || !target.participant) {
    return {
      allowed: false,
      reason: target.reason,
      authorityExpanded: false
    };
  }

  const child: CouncilTask = {
    ...current,
    taskId: request.childTaskId,
    rootTaskId: current.rootTaskId,
    parentTaskId: current.taskId,
    assignedById: current.assigneeId,
    assigneeId: target.participant.id,
    requiredCapability: request.requiredCapability,
    scope: {
      ...current.scope,
      allowedCapabilities: [...current.scope.allowedCapabilities]
    },
    delegationDepth: current.delegationDepth + 1,
    visitedParticipantIds: [
      ...current.visitedParticipantIds,
      target.participant.id
    ],
    provenance: target.participant.provenance,
    status: "open"
  };

  return {
    allowed: true,
    reason: "The task was routed within its inherited capability, lifetime, and delegation bounds.",
    task: child,
    authorityExpanded: false
  };
}
