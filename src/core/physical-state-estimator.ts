import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface PhysicalMeasurement {
  variable: string;
  source: string;
  value: number;
  confidence?: number; // 0-1
}

export interface PhysicalVariableSpec {
  variable: string;
  conflictTolerance?: number; // same units as the variable
}

export interface PhysicalStateEstimate {
  variable: string;
  value: number;
  confidence: number;
  minimumObserved: number;
  maximumObserved: number;
  spread: number;
  sources: string[];
  conflicting: boolean;
}

export interface PhysicalStateEstimateSet {
  estimates: PhysicalStateEstimate[];
  conflictingVariables: string[];
  invalidVariables: string[];
  sourceCount: number;
  preservesSourceDisagreement: true;
  preferredSensorType: null;
}

export function estimatePhysicalState(
  measurements: PhysicalMeasurement[] = [],
  specs: PhysicalVariableSpec[] = []
): PhysicalStateEstimateSet {
  const specByVariable = new Map(
    specs.map((spec) => [spec.variable, spec])
  );
  const grouped = new Map<string, PhysicalMeasurement[]>();

  const invalidVariables = Array.from(new Set(
    measurements
      .filter((measurement) =>
        finiteOrNull(measurement.value) === null ||
        (measurement.confidence !== undefined && finiteOrNull(measurement.confidence) === null)
      )
      .map((measurement) => measurement.variable)
  ));

  for (const measurement of measurements) {
    if (finiteOrNull(measurement.value) === null) continue;
    const current = grouped.get(measurement.variable) ?? [];
    current.push(measurement);
    grouped.set(measurement.variable, current);
  }

  const estimates: PhysicalStateEstimate[] = [];

  for (const [variable, group] of grouped) {
    const weighted = group.map((measurement) => ({
      ...measurement,
      boundedConfidence: boundedFinite(measurement.confidence, measurement.confidence === undefined ? 0.5 : 0)
    }));
    const totalWeight = weighted.reduce(
      (sum, measurement) => sum + measurement.boundedConfidence,
      0
    );
    const value =
      totalWeight === 0
        ? group.reduce((sum, measurement) => sum + measurement.value, 0) /
          group.length
        : weighted.reduce(
            (sum, measurement) =>
              sum + measurement.value * measurement.boundedConfidence,
            0
          ) / totalWeight;

    const values = group.map((measurement) => measurement.value);
    const minimumObserved = Math.min(...values);
    const maximumObserved = Math.max(...values);
    const spread = maximumObserved - minimumObserved;
    const suppliedTolerance = specByVariable.get(variable)?.conflictTolerance;
    const tolerance = finiteOrNull(suppliedTolerance);
    const conflicting =
      suppliedTolerance !== undefined &&
      (tolerance === null || spread > Math.max(0, tolerance));

    const averageConfidence =
      weighted.reduce(
        (sum, measurement) => sum + measurement.boundedConfidence,
        0
      ) / group.length;

    // Disagreement lowers confidence, but it remains visible instead of
    // silently selecting one sensor as the winner.
    const confidence = conflicting
      ? averageConfidence * 0.5
      : averageConfidence;

    estimates.push({
      variable,
      value,
      confidence,
      minimumObserved,
      maximumObserved,
      spread,
      sources: group.map((measurement) => measurement.source),
      conflicting
    });
  }

  return {
    estimates,
    conflictingVariables: estimates
      .filter((estimate) => estimate.conflicting)
      .map((estimate) => estimate.variable),
    invalidVariables,
    sourceCount: new Set(measurements.map((measurement) => measurement.source)).size,
    preservesSourceDisagreement: true,
    preferredSensorType: null
  };
}
