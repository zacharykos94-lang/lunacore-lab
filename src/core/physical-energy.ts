import type { ResourceShelterDecision } from "./resource-shelter.js";
import { finiteOrNull, nonNegativeFinite } from "./physical-number.js";

export interface PhysicalEnergyDemand {
  amount: number;
  essential?: boolean;
  reserveUseAllowed?: boolean;
}

export type PhysicalEnergyStatus =
  | "unknown"
  | "ready"
  | "conserve"
  | "review"
  | "blocked";

export interface PhysicalEnergyDecision {
  status: PhysicalEnergyStatus;
  requestedEnergy: number;
  currentSurplus: number;
  reserveHeadroom: number;
  renewableShare: number | null;
  actionReady: boolean;
  reserveUseRequired: boolean;
  reason: string;
}

export function evaluatePhysicalEnergyDemand(
  demand: PhysicalEnergyDemand,
  resources?: ResourceShelterDecision
): PhysicalEnergyDecision {
  const requestedEnergy = nonNegativeFinite(demand.amount, 0);
  const malformedDemand = finiteOrNull(demand.amount) === null;

  if (malformedDemand || !resources) {
    return {
      status: malformedDemand ? "unknown" : requestedEnergy === 0 ? "ready" : "unknown",
      requestedEnergy,
      currentSurplus: 0,
      reserveHeadroom: 0,
      renewableShare: null,
      actionReady: !malformedDemand && requestedEnergy === 0,
      reserveUseRequired: false,
      reason:
        malformedDemand
          ? "Physical energy demand is malformed or non-finite; treat supply readiness as unknown."
          : requestedEnergy === 0
          ? "No additional physical energy demand is represented."
          : "Physical energy demand is represented but no resource state is available; do not assume energy supply."
    };
  }

  const malformedResources = [
    resources.netEnergy,
    resources.reserve,
    resources.minimumReserve,
    resources.renewableShare
  ].some((value) => finiteOrNull(value) === null);
  const currentSurplus = nonNegativeFinite(resources.netEnergy, 0);
  const reserveHeadroom = Math.max(
    0,
    nonNegativeFinite(resources.reserve, 0) - nonNegativeFinite(resources.minimumReserve, 0)
  );

  if (malformedResources) {
    return {
      status: "unknown",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: null,
      actionReady: false,
      reserveUseRequired: false,
      reason: "Resource energy state is malformed or non-finite; do not assume available supply."
    };
  }

  if (requestedEnergy === 0) {
    return {
      status: "ready",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: resources.renewableShare,
      actionReady: true,
      reserveUseRequired: false,
      reason: "No additional physical energy demand is represented."
    };
  }

  if (demand.essential !== true && resources.shelterState !== "secure") {
    return {
      status: "conserve",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: resources.renewableShare,
      actionReady: false,
      reserveUseRequired: false,
      reason:
        "Secure shelter remains the higher resource priority; defer optional physical energy use."
    };
  }

  if (demand.essential !== true && resources.conserveEnergy) {
    return {
      status: "conserve",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: resources.renewableShare,
      actionReady: false,
      reserveUseRequired: false,
      reason:
        "The resource layer is conserving energy; optional physical demand should not consume protected capacity."
    };
  }

  if (currentSurplus >= requestedEnergy) {
    return {
      status: "ready",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: resources.renewableShare,
      actionReady: true,
      reserveUseRequired: false,
      reason:
        "Current represented generation surplus covers the physical energy demand without drawing below reserve policy."
    };
  }

  const shortfall = requestedEnergy - currentSurplus;
  const reserveUseAllowed = demand.reserveUseAllowed === true;

  if (
    demand.essential === true &&
    reserveUseAllowed &&
    reserveHeadroom >= shortfall
  ) {
    return {
      status: "review",
      requestedEnergy,
      currentSurplus,
      reserveHeadroom,
      renewableShare: resources.renewableShare,
      actionReady: false,
      reserveUseRequired: true,
      reason:
        "The essential demand could be covered only by drawing from reserve headroom; review before consuming reserve capacity."
    };
  }

  return {
    status: "blocked",
    requestedEnergy,
    currentSurplus,
    reserveHeadroom,
    renewableShare: resources.renewableShare,
    actionReady: false,
    reserveUseRequired: currentSurplus < requestedEnergy,
    reason:
      "The represented current surplus does not cover the physical energy demand under the supplied reserve policy."
  };
}
