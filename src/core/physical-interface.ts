import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface PhysicalChannel {
  name: string;
  available?: boolean;
  confidence?: number; // 0-1
}

export interface EquilibriumState {
  stability?: number; // 0-1
  confidence?: number; // 0-1
}

export interface PhysicalEnvironment {
  medium?: string;
  referenceFrame?: string;
  uncertainty?: number; // 0-1
}

export interface PhysicalIntent {
  goal?: string;
  movementRequested?: boolean;
  interactionRequested?: boolean;
}

export interface PhysicalInterfaceInput {
  sensoryInputs?: PhysicalChannel[];
  outputChannels?: PhysicalChannel[];
  equilibrium?: EquilibriumState;
  environment?: PhysicalEnvironment;
  intent?: PhysicalIntent;
}

export type PhysicalReadiness =
  | "observe"
  | "stabilize"
  | "ready";

export interface PhysicalInterfaceDecision {
  sensoryChannelsAvailable: string[];
  outputChannelsAvailable: string[];
  visualInputAvailable: boolean;
  visualOutputAvailable: boolean;
  equilibriumKnown: boolean;
  stability: number | null;
  environmentKnown: boolean;
  medium: string | null;
  readiness: PhysicalReadiness;
  movementRequested: boolean;
  interactionRequested: boolean;
  physicalActionRequiresAuthorization: boolean;
  reason: string;
}

function availableChannels(channels: PhysicalChannel[] | undefined): string[] {
  return (channels ?? [])
    .filter((channel) => channel.available !== false)
    .filter((channel) =>
      channel.confidence === undefined
        ? true
        : boundedFinite(channel.confidence, 0) > 0
    )
    .map((channel) => channel.name);
}

export function evaluatePhysicalInterface(
  input: PhysicalInterfaceInput = {}
): PhysicalInterfaceDecision {
  const sensoryChannelsAvailable = availableChannels(input.sensoryInputs);
  const outputChannelsAvailable = availableChannels(input.outputChannels);
  const rawStability = finiteOrNull(input.equilibrium?.stability);
  const stability =
    rawStability === null ? null : boundedFinite(rawStability, 0);
  const equilibriumKnown = stability !== null;
  const environmentKnown = Boolean(
    input.environment?.medium || input.environment?.referenceFrame
  );
  const movementRequested = input.intent?.movementRequested === true;
  const interactionRequested = input.intent?.interactionRequested === true;

  let readiness: PhysicalReadiness = "observe";
  let reason =
    "Physical state is incomplete or no physical change is requested; continue sensing and observing.";

  if (equilibriumKnown && stability < 0.5) {
    readiness = "stabilize";
    reason =
      "Current equilibrium is below the preferred stability threshold; stabilize before optional movement or interaction.";
  } else if (equilibriumKnown && environmentKnown) {
    readiness = "ready";
    reason =
      "Physical state and environment are sufficiently represented for higher-level planning, subject to authorization.";
  }

  return {
    sensoryChannelsAvailable,
    outputChannelsAvailable,
    visualInputAvailable: sensoryChannelsAvailable.includes("visual"),
    visualOutputAvailable: outputChannelsAvailable.includes("visual"),
    equilibriumKnown,
    stability,
    environmentKnown,
    medium: input.environment?.medium ?? null,
    readiness,
    movementRequested,
    interactionRequested,
    physicalActionRequiresAuthorization:
      movementRequested || interactionRequested,
    reason
  };
}
