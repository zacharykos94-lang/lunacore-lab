import type { PhysicalReadiness } from "./physical-interface.js";
import type { PhysicalFeedbackDisposition } from "./physical-feedback.js";
import type { PhysicalConstraintStatus } from "./physical-constraints.js";
import type { AuthorizationStatus } from "./human-authorization.js";
import type { PhysicalOutputStatus } from "./physical-output.js";
import type { PhysicalEnergyStatus } from "./physical-energy.js";

export type PhysicalFoundationStatus =
  | "observe"
  | "stabilize"
  | "review"
  | "blocked"
  | "ready";

export interface PhysicalReadinessInput {
  actionRequested?: boolean;
  interfaceReadiness?: PhysicalReadiness;
  feedbackDisposition?: PhysicalFeedbackDisposition;
  worldQuerySupplied?: boolean;
  worldReachable?: true | null;
  conflictingVariables?: string[];
  staleRequiredVariables?: string[];
  capabilityActionReady?: boolean;
  resilienceActionReady?: boolean;
  energyStatus?: PhysicalEnergyStatus;
  energyActionReady?: boolean;
  constraintStatus?: PhysicalConstraintStatus;
  authorizationStatus?: AuthorizationStatus;
  outputStatus?: PhysicalOutputStatus;
}

export interface PhysicalReadinessDecision {
  status: PhysicalFoundationStatus;
  representedGatesClear: boolean;
  blockers: string[];
  reviewSignals: string[];
  mechanismAssumed: false;
  newAuthorityGranted: false;
  reason: string;
}

export function evaluatePhysicalReadiness(
  input: PhysicalReadinessInput = {}
): PhysicalReadinessDecision {
  const blockers: string[] = [];
  const reviewSignals: string[] = [];

  if (input.constraintStatus === "blocked") {
    blockers.push("hard-physical-constraint");
  }
  if (input.authorizationStatus === "blocked") {
    blockers.push("human-rejection");
  }
  if (input.energyStatus === "blocked") {
    blockers.push("physical-energy-insufficient");
  }

  if (blockers.length > 0) {
    return {
      status: "blocked",
      representedGatesClear: false,
      blockers,
      reviewSignals,
      mechanismAssumed: false,
      newAuthorityGranted: false,
      reason:
        "A represented blocking condition prevents the requested physical action."
    };
  }

  if (input.authorizationStatus === "approval-required") {
    reviewSignals.push("authorization-required");
  }
  if (input.constraintStatus === "review") {
    reviewSignals.push("physical-constraint-review");
  }
  if (
    input.worldQuerySupplied === true &&
    input.worldReachable !== true
  ) {
    reviewSignals.push("spatial-transition-unknown");
  }
  if ((input.conflictingVariables?.length ?? 0) > 0) {
    reviewSignals.push("sensor-conflict");
  }
  if ((input.staleRequiredVariables?.length ?? 0) > 0) {
    reviewSignals.push("required-state-stale");
  }
  if (input.capabilityActionReady === false) {
    reviewSignals.push("required-capability-unavailable");
  }
  if (input.resilienceActionReady === false) {
    reviewSignals.push("required-subsystem-unavailable");
  }
  if (
    input.energyStatus === "unknown" ||
    input.energyStatus === "conserve" ||
    input.energyStatus === "review" ||
    input.energyActionReady === false
  ) {
    reviewSignals.push("physical-energy-not-ready");
  }

  if (reviewSignals.length > 0) {
    return {
      status: "review",
      representedGatesClear: false,
      blockers,
      reviewSignals,
      mechanismAssumed: false,
      newAuthorityGranted: false,
      reason:
        "One or more represented physical prerequisites require review or fresh evidence before proceeding."
    };
  }

  if (
    input.interfaceReadiness === "stabilize" ||
    input.feedbackDisposition === "stabilize"
  ) {
    return {
      status: "stabilize",
      representedGatesClear: false,
      blockers,
      reviewSignals,
      mechanismAssumed: false,
      newAuthorityGranted: false,
      reason:
        "Equilibrium or stability should be restored before optional physical change."
    };
  }

  const observationNeeded =
    input.actionRequested !== true ||
    input.interfaceReadiness === "observe" ||
    input.feedbackDisposition === "observe" ||
    input.outputStatus === "observe" ||
    input.outputStatus === "unavailable";

  if (observationNeeded) {
    return {
      status: "observe",
      representedGatesClear: false,
      blockers,
      reviewSignals,
      mechanismAssumed: false,
      newAuthorityGranted: false,
      reason:
        "The represented physical state does not yet justify an external state-changing action; continue observation or preserve the current condition."
    };
  }

  if (input.outputStatus === "ready") {
    return {
      status: "ready",
      representedGatesClear: true,
      blockers,
      reviewSignals,
      mechanismAssumed: false,
      newAuthorityGranted: false,
      reason:
        "The currently represented physical gates are clear for the already-authorized abstract output; implementation remains outside this summary."
    };
  }

  return {
    status: "observe",
    representedGatesClear: false,
    blockers,
    reviewSignals,
    mechanismAssumed: false,
    newAuthorityGranted: false,
    reason:
      "No complete authorized physical-output decision is represented; continue observation."
  };
}
