import { finiteOrNull } from "./physical-number.js";

export type PhysicalSubsystemStatus =
  | "nominal"
  | "degraded"
  | "unavailable"
  | "unknown";

export interface PhysicalSubsystemState {
  name: string;
  status: PhysicalSubsystemStatus;
  requiredForAction?: boolean;
  confidence?: number; // 0-1
}

export type PhysicalResilienceMode =
  | "normal"
  | "degraded"
  | "observe";

export interface PhysicalResilienceDecision {
  mode: PhysicalResilienceMode;
  degradedSubsystems: string[];
  unavailableSubsystems: string[];
  unknownRequiredSubsystems: string[];
  actionReady: boolean;
  automaticRecoveryAttempted: false;
  failedSubsystemBypassed: false;
  reason: string;
}

export function evaluatePhysicalResilience(
  subsystems: PhysicalSubsystemState[] = []
): PhysicalResilienceDecision {
  if (subsystems.length === 0) {
    return {
      mode: "observe",
      degradedSubsystems: [],
      unavailableSubsystems: [],
      unknownRequiredSubsystems: [],
      actionReady: false,
      automaticRecoveryAttempted: false,
      failedSubsystemBypassed: false,
      reason:
        "No subsystem health state is represented; do not assume physical readiness."
    };
  }

  const degradedSubsystems = subsystems
    .filter((subsystem) => subsystem.status === "degraded")
    .map((subsystem) => subsystem.name);
  const unavailableSubsystems = subsystems
    .filter((subsystem) => subsystem.status === "unavailable")
    .map((subsystem) => subsystem.name);
  const unknownRequiredSubsystems = subsystems
    .filter(
      (subsystem) =>
        subsystem.requiredForAction === true &&
        (subsystem.status === "unknown" ||
          (subsystem.confidence !== undefined && finiteOrNull(subsystem.confidence) === null))
    )
    .map((subsystem) => subsystem.name);

  const requiredUnavailable = subsystems.some(
    (subsystem) =>
      subsystem.requiredForAction === true &&
      subsystem.status === "unavailable"
  );
  const requiredDegraded = subsystems.some(
    (subsystem) =>
      subsystem.requiredForAction === true &&
      subsystem.status === "degraded"
  );

  if (requiredUnavailable || unknownRequiredSubsystems.length > 0) {
    return {
      mode: "observe",
      degradedSubsystems,
      unavailableSubsystems,
      unknownRequiredSubsystems,
      actionReady: false,
      automaticRecoveryAttempted: false,
      failedSubsystemBypassed: false,
      reason:
        "A subsystem required for physical action is unavailable or unknown; return to observation until new health evidence is represented."
    };
  }

  if (requiredDegraded || degradedSubsystems.length > 0) {
    return {
      mode: "degraded",
      degradedSubsystems,
      unavailableSubsystems,
      unknownRequiredSubsystems,
      actionReady: !requiredDegraded,
      automaticRecoveryAttempted: false,
      failedSubsystemBypassed: false,
      reason: requiredDegraded
        ? "A required subsystem is degraded; physical action should be reviewed rather than treating degraded operation as normal."
        : "A non-required subsystem is degraded; preserve the degradation signal without blocking unrelated action."
    };
  }

  return {
    mode: "normal",
    degradedSubsystems,
    unavailableSubsystems,
    unknownRequiredSubsystems,
    actionReady: true,
    automaticRecoveryAttempted: false,
    failedSubsystemBypassed: false,
    reason:
      "All represented required subsystems are nominal; no failed subsystem has been bypassed."
  };
}
