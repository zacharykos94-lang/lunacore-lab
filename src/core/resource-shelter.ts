import { authorizeAction } from "./human-authorization.js";

export type ShelterState =
  | "secure"
  | "temporary"
  | "unsafe"
  | "unknown";

export type ResourcePriority =
  | "secure-shelter-first"
  | "essential-energy-conservation"
  | "rebuild-energy-reserve"
  | "stable-stewardship";

export interface EnergyProfile {
  renewableGeneration: number;
  nonRenewableGeneration?: number;
  essentialConsumption: number;
  optionalConsumption: number;
  reserve: number;
  minimumReserve: number;
}

export interface ResourceShelterInput {
  shelterState?: ShelterState;
  energy: EnergyProfile;
  humanApprovalForPhysicalAction?: boolean;
}

export interface ResourceShelterDecision {
  shelterState: ShelterState;
  priority: ResourcePriority;
  renewableGeneration: number;
  nonRenewableGeneration: number;
  essentialConsumption: number;
  optionalConsumption: number;
  reserve: number;
  minimumReserve: number;
  totalGeneration: number;
  totalConsumption: number;
  netEnergy: number;
  renewableShare: number;
  conserveEnergy: boolean;
  optionalExpansionAllowed: boolean;
  physicalActionAuthorized: boolean;
  reason: string;
}

function nonNegative(value: number): number {
  return Math.max(0, value);
}

export function evaluateResourceShelter(
  input: ResourceShelterInput
): ResourceShelterDecision {
  const shelterState = input.shelterState ?? "unknown";
  const renewableGeneration = nonNegative(input.energy.renewableGeneration);
  const nonRenewableGeneration = nonNegative(
    input.energy.nonRenewableGeneration ?? 0
  );
  const essentialConsumption = nonNegative(input.energy.essentialConsumption);
  const optionalConsumption = nonNegative(input.energy.optionalConsumption);
  const reserve = nonNegative(input.energy.reserve);
  const minimumReserve = nonNegative(input.energy.minimumReserve);

  const totalGeneration = renewableGeneration + nonRenewableGeneration;
  const totalConsumption = essentialConsumption + optionalConsumption;
  const netEnergy = totalGeneration - totalConsumption;
  const renewableShare =
    totalGeneration === 0 ? 0 : renewableGeneration / totalGeneration;

  const shelterNeedsSecuring = shelterState !== "secure";
  const essentialEnergyShortfall = totalGeneration < essentialConsumption;
  const reserveBelowMinimum = reserve < minimumReserve;
  const conserveEnergy =
    essentialEnergyShortfall || reserveBelowMinimum || netEnergy < 0;

  let priority: ResourcePriority = "stable-stewardship";
  let reason =
    "Shelter is secure and current energy conditions support ordinary stewardship.";

  if (shelterNeedsSecuring) {
    priority = "secure-shelter-first";
    reason =
      "Secure shelter is the baseline priority before optional expansion.";
  } else if (essentialEnergyShortfall) {
    priority = "essential-energy-conservation";
    reason =
      "Current generation does not cover essential consumption; conserve and protect essential loads.";
  } else if (reserveBelowMinimum || netEnergy < 0) {
    priority = "rebuild-energy-reserve";
    reason =
      "Energy reserves or current balance are below the preferred operating margin.";
  }

  const physicalAuthorization = authorizeAction({
    actionClass: "physical-infrastructure",
    externalEffect: true,
    reversible: false,
    explicitHumanApproval: input.humanApprovalForPhysicalAction
  });

  const physicalActionAuthorized = physicalAuthorization.authorized;

  const optionalExpansionAllowed =
    shelterState === "secure" &&
    !conserveEnergy &&
    physicalActionAuthorized;

  return {
    shelterState,
    priority,
    renewableGeneration,
    nonRenewableGeneration,
    essentialConsumption,
    optionalConsumption,
    reserve,
    minimumReserve,
    totalGeneration,
    totalConsumption,
    netEnergy,
    renewableShare,
    conserveEnergy,
    optionalExpansionAllowed,
    physicalActionAuthorized,
    reason
  };
}
