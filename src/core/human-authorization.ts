export type ActionClass =
  | "analysis"
  | "communication"
  | "digital-change"
  | "financial"
  | "physical-interaction"
  | "physical-infrastructure"
  | "account-security"
  | "irreversible";

export type AuthorizationStatus =
  | "allowed"
  | "approval-required"
  | "blocked";

export interface AuthorizationRequest {
  actionClass: ActionClass;
  externalEffect?: boolean;
  reversible?: boolean;
  explicitHumanApproval?: boolean;
  activeDelegation?: boolean;
  delegationAllowsAction?: boolean;
  humanRejected?: boolean;
}

export interface AuthorizationDecision {
  status: AuthorizationStatus;
  humanApprovalRequired: boolean;
  authorized: boolean;
  reason: string;
  recommendationIsAuthorization: false;
  delegationIsRevocable: true;
}

const explicitOnly = new Set<ActionClass>([
  "financial",
  "physical-infrastructure",
  "account-security",
  "irreversible"
]);

export function authorizeAction(
  request: AuthorizationRequest
): AuthorizationDecision {
  if (request.humanRejected) {
    return {
      status: "blocked",
      humanApprovalRequired: true,
      authorized: false,
      reason: "The human explicitly rejected this action.",
      recommendationIsAuthorization: false,
      delegationIsRevocable: true
    };
  }

  const externalEffect = request.externalEffect ?? request.actionClass !== "analysis";
  const reversible = request.reversible ?? true;

  if (request.actionClass === "analysis" && !externalEffect) {
    return {
      status: "allowed",
      humanApprovalRequired: false,
      authorized: true,
      reason: "Read-only analysis has no external side effect.",
      recommendationIsAuthorization: false,
      delegationIsRevocable: true
    };
  }

  if (explicitOnly.has(request.actionClass) || !reversible) {
    const approved = request.explicitHumanApproval === true;
    return {
      status: approved ? "allowed" : "approval-required",
      humanApprovalRequired: true,
      authorized: approved,
      reason: approved
        ? "Explicit human approval authorizes this high-impact action."
        : "This action requires explicit human approval; delegation alone is insufficient.",
      recommendationIsAuthorization: false,
      delegationIsRevocable: true
    };
  }

  const delegated =
    request.activeDelegation === true &&
    request.delegationAllowsAction === true;
  const approved = request.explicitHumanApproval === true || delegated;

  return {
    status: approved ? "allowed" : "approval-required",
    humanApprovalRequired: !delegated,
    authorized: approved,
    reason: approved
      ? request.explicitHumanApproval
        ? "Explicit human approval authorizes this action."
        : "An active, scoped, revocable delegation authorizes this reversible action."
      : "An external side effect requires human approval or an active scoped delegation.",
    recommendationIsAuthorization: false,
    delegationIsRevocable: true
  };
}
