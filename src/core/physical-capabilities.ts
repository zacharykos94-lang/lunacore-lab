import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface PhysicalCapability {
  name: string;
  roles: string[];
  available?: boolean;
  confidence?: number; // 0-1
  medium?: string;
}

export interface PhysicalCapabilityRequirement {
  role: string;
  minimumConfidence?: number; // 0-1
  requiredForAction?: boolean;
}

export type PhysicalCapabilityStatus =
  | "unknown"
  | "ready"
  | "degraded"
  | "unavailable";

export interface PhysicalCapabilityDecision {
  status: PhysicalCapabilityStatus;
  availableCapabilities: string[];
  unmetRequirements: string[];
  degradedRequirements: string[];
  actionReady: boolean;
  mechanismSelected: false;
  capabilityAssumed: false;
  reason: string;
}

export function evaluatePhysicalCapabilities(
  capabilities: PhysicalCapability[] = [],
  requirements: PhysicalCapabilityRequirement[] = []
): PhysicalCapabilityDecision {
  const available = capabilities.filter(
    (capability) => capability.available !== false
  );
  const availableCapabilities = available.map((capability) => capability.name);

  if (requirements.length === 0) {
    return {
      status: capabilities.length === 0 ? "unknown" : "ready",
      availableCapabilities,
      unmetRequirements: [],
      degradedRequirements: [],
      actionReady: true,
      mechanismSelected: false,
      capabilityAssumed: false,
      reason:
        capabilities.length === 0
          ? "No capability requirements or available capabilities are represented; do not assume an embodiment."
          : "Capabilities are represented, but no specific requirement has been imposed."
    };
  }

  const unmetRequirements: string[] = [];
  const degradedRequirements: string[] = [];

  for (const requirement of requirements) {
    const candidates = available.filter((capability) =>
      capability.roles.includes(requirement.role)
    );

    if (candidates.length === 0) {
      unmetRequirements.push(requirement.role);
      continue;
    }

    const malformedMinimum = requirement.minimumConfidence !== undefined &&
      finiteOrNull(requirement.minimumConfidence) === null;
    const minimumConfidence = boundedFinite(requirement.minimumConfidence, malformedMinimum ? 1 : 0);
    const bestConfidence = Math.max(
      ...candidates.map((capability) => boundedFinite(
        capability.confidence,
        capability.confidence === undefined ? 0.5 : 0
      ))
    );

    if (malformedMinimum || bestConfidence < minimumConfidence) {
      degradedRequirements.push(requirement.role);
    }
  }

  const requiredUnmet = requirements.some(
    (requirement) =>
      requirement.requiredForAction === true &&
      unmetRequirements.includes(requirement.role)
  );
  const requiredDegraded = requirements.some(
    (requirement) =>
      requirement.requiredForAction === true &&
      degradedRequirements.includes(requirement.role)
  );

  let status: PhysicalCapabilityStatus = "ready";
  if (requiredUnmet) status = "unavailable";
  else if (requiredDegraded || degradedRequirements.length > 0) status = "degraded";
  else if (unmetRequirements.length > 0) status = "degraded";

  const actionReady = !requiredUnmet && !requiredDegraded;

  return {
    status,
    availableCapabilities,
    unmetRequirements,
    degradedRequirements,
    actionReady,
    mechanismSelected: false,
    capabilityAssumed: false,
    reason: !actionReady
      ? "One or more capabilities explicitly required for physical action are unavailable or below the supplied confidence threshold."
      : status === "degraded"
        ? "Some represented capability requirements are degraded or unavailable, but none of those gaps is marked as required for this action."
        : "The explicitly represented capability requirements are currently satisfied without selecting a physical mechanism."
  };
}
