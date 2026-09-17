import type { PhysicalReadiness } from "./physical-interface.js";

export interface PhysicalStateObservation {
  name: string;
  value?: number;
  confidence?: number; // 0-1
}

export interface DesiredStateRegion {
  name: string;
  minimum?: number;
  maximum?: number;
  target?: number;
  tolerance?: number;
}

export interface PhysicalFeedbackInput {
  observations?: PhysicalStateObservation[];
  desiredRegions?: DesiredStateRegion[];
  readiness?: PhysicalReadiness;
  environmentalUncertainty?: number; // 0-1
  changeCost?: number; // 0-1; energy, wear, disruption, or other cost
}

export type PhysicalFeedbackDisposition =
  | "observe"
  | "hold"
  | "stabilize"
  | "adjust";

export interface PhysicalDeviation {
  name: string;
  observedValue: number;
  desiredMinimum: number | null;
  desiredMaximum: number | null;
  target: number | null;
  magnitude: number;
}

export interface PhysicalFeedbackDecision {
  disposition: PhysicalFeedbackDisposition;
  observationsKnown: number;
  deviations: PhysicalDeviation[];
  confidence: number;
  uncertainty: number;
  adjustmentScale: number;
  physicalActionRequiresAuthorization: boolean;
  reobserveAfterChange: true;
  directActuationSpecified: false;
  reason: string;
}

function bounded(value: number | undefined, fallback = 0): number {
  if (value === undefined) return fallback;
  return Math.max(0, Math.min(1, value));
}

function regionDeviation(
  observation: PhysicalStateObservation,
  region: DesiredStateRegion
): PhysicalDeviation | null {
  if (observation.value === undefined) return null;

  const value = observation.value;
  const tolerance = Math.max(0, region.tolerance ?? 0);

  if (region.minimum !== undefined && value < region.minimum - tolerance) {
    return {
      name: observation.name,
      observedValue: value,
      desiredMinimum: region.minimum,
      desiredMaximum: region.maximum ?? null,
      target: region.target ?? null,
      magnitude: region.minimum - value
    };
  }

  if (region.maximum !== undefined && value > region.maximum + tolerance) {
    return {
      name: observation.name,
      observedValue: value,
      desiredMinimum: region.minimum ?? null,
      desiredMaximum: region.maximum,
      target: region.target ?? null,
      magnitude: value - region.maximum
    };
  }

  if (
    region.target !== undefined &&
    Math.abs(value - region.target) > tolerance
  ) {
    return {
      name: observation.name,
      observedValue: value,
      desiredMinimum: region.minimum ?? null,
      desiredMaximum: region.maximum ?? null,
      target: region.target,
      magnitude: Math.abs(value - region.target)
    };
  }

  return null;
}

export function evaluatePhysicalFeedback(
  input: PhysicalFeedbackInput = {}
): PhysicalFeedbackDecision {
  const observations = input.observations ?? [];
  const regions = input.desiredRegions ?? [];
  const known = observations.filter((observation) => observation.value !== undefined);

  const averageConfidence =
    known.length === 0
      ? 0
      : known.reduce(
          (sum, observation) => sum + bounded(observation.confidence, 0.5),
          0
        ) / known.length;

  const uncertainty = bounded(input.environmentalUncertainty);
  const changeCost = bounded(input.changeCost);

  const regionByName = new Map(regions.map((region) => [region.name, region]));
  const deviations = known.flatMap((observation) => {
    const region = regionByName.get(observation.name);
    if (!region) return [];
    const deviation = regionDeviation(observation, region);
    return deviation ? [deviation] : [];
  });

  if (known.length === 0 || averageConfidence < 0.4 || uncertainty >= 0.75) {
    return {
      disposition: "observe",
      observationsKnown: known.length,
      deviations,
      confidence: averageConfidence,
      uncertainty,
      adjustmentScale: 0,
      physicalActionRequiresAuthorization: false,
      reobserveAfterChange: true,
      directActuationSpecified: false,
      reason:
        "Physical state confidence is too limited for adjustment; continue sensing and reduce uncertainty."
    };
  }

  if (input.readiness === "stabilize") {
    return {
      disposition: "stabilize",
      observationsKnown: known.length,
      deviations,
      confidence: averageConfidence,
      uncertainty,
      adjustmentScale: Math.max(0.1, Math.min(0.5, averageConfidence * (1 - uncertainty) * (1 - changeCost))),
      physicalActionRequiresAuthorization: true,
      reobserveAfterChange: true,
      directActuationSpecified: false,
      reason:
        "Stability takes priority over optional movement; use only a bounded corrective change and re-observe."
    };
  }

  if (deviations.length === 0) {
    return {
      disposition: "hold",
      observationsKnown: known.length,
      deviations,
      confidence: averageConfidence,
      uncertainty,
      adjustmentScale: 0,
      physicalActionRequiresAuthorization: false,
      reobserveAfterChange: true,
      directActuationSpecified: false,
      reason:
        "Observed state is within the represented desired region; preserve the current condition and continue sensing."
    };
  }

  const adjustmentScale = Math.max(
    0.05,
    Math.min(0.5, averageConfidence * (1 - uncertainty) * (1 - changeCost))
  );

  return {
    disposition: "adjust",
    observationsKnown: known.length,
    deviations,
    confidence: averageConfidence,
    uncertainty,
    adjustmentScale,
    physicalActionRequiresAuthorization: true,
    reobserveAfterChange: true,
    directActuationSpecified: false,
    reason:
      "Observed state differs from the represented desired region; make only a bounded adjustment, then re-observe before further change."
  };
}
