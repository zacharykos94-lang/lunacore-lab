import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface TimedPhysicalObservation {
  variable: string;
  value: number;
  observedAt: number;
  confidence?: number; // 0-1
}

export interface PhysicalChangeSpec {
  variable: string;
  staleAfter?: number; // same time units as observedAt/currentTime
  stableDelta?: number; // same units as the variable
  requiredForAction?: boolean;
}

export type PhysicalTrend =
  | "increasing"
  | "decreasing"
  | "stable"
  | "unknown";

export interface PhysicalChangeEstimate {
  variable: string;
  latestValue: number;
  latestObservedAt: number;
  previousValue: number | null;
  previousObservedAt: number | null;
  delta: number | null;
  elapsed: number | null;
  rate: number | null;
  trend: PhysicalTrend;
  confidence: number;
  stale: boolean;
  requiredForAction: boolean;
}

export interface PhysicalChangeDecision {
  estimates: PhysicalChangeEstimate[];
  staleVariables: string[];
  staleRequiredVariables: string[];
  unknownRequiredVariables: string[];
  extrapolationPerformed: false;
  futureStateInvented: false;
}

export function evaluatePhysicalChange(
  observations: TimedPhysicalObservation[] = [],
  specs: PhysicalChangeSpec[] = [],
  currentTime?: number
): PhysicalChangeDecision {
  const invalidObservationVariables = new Set(
    observations
      .filter((observation) =>
        finiteOrNull(observation.value) === null ||
        finiteOrNull(observation.observedAt) === null ||
        (observation.confidence !== undefined && finiteOrNull(observation.confidence) === null)
      )
      .map((observation) => observation.variable)
  );
  const currentTimeInvalid = currentTime !== undefined && finiteOrNull(currentTime) === null;
  const specByVariable = new Map(
    specs.map((spec) => [spec.variable, spec])
  );
  const grouped = new Map<string, TimedPhysicalObservation[]>();

  for (const observation of observations) {
    if (finiteOrNull(observation.value) === null || finiteOrNull(observation.observedAt) === null) continue;
    const group = grouped.get(observation.variable) ?? [];
    group.push(observation);
    grouped.set(observation.variable, group);
  }

  const estimates: PhysicalChangeEstimate[] = [];

  for (const [variable, group] of grouped) {
    const ordered = [...group].sort((a, b) => a.observedAt - b.observedAt);
    const latest = ordered[ordered.length - 1];
    if (!latest) continue;
    const previous = ordered.length > 1 ? ordered[ordered.length - 2] : undefined;
    const spec = specByVariable.get(variable);

    const delta = previous ? latest.value - previous.value : null;
    const elapsed = previous ? latest.observedAt - previous.observedAt : null;
    const rate =
      delta !== null && elapsed !== null && elapsed > 0
        ? delta / elapsed
        : null;

    const stableDelta = Math.max(0, finiteOrNull(spec?.stableDelta) ?? 0);
    let trend: PhysicalTrend = "unknown";
    if (delta !== null) {
      if (Math.abs(delta) <= stableDelta) trend = "stable";
      else if (delta > 0) trend = "increasing";
      else trend = "decreasing";
    }

    const age =
      currentTime === undefined || finiteOrNull(currentTime) === null
        ? 0
        : Math.max(0, currentTime - latest.observedAt);
    const stale =
      spec?.staleAfter !== undefined &&
      (currentTimeInvalid || finiteOrNull(spec.staleAfter) === null || age > Math.max(0, spec.staleAfter));

    const confidence = previous
      ? Math.min(
          boundedFinite(latest.confidence, latest.confidence === undefined ? 0.5 : 0),
          boundedFinite(previous.confidence, previous.confidence === undefined ? 0.5 : 0)
        )
      : boundedFinite(latest.confidence, latest.confidence === undefined ? 0.5 : 0);

    estimates.push({
      variable,
      latestValue: latest.value,
      latestObservedAt: latest.observedAt,
      previousValue: previous?.value ?? null,
      previousObservedAt: previous?.observedAt ?? null,
      delta,
      elapsed,
      rate,
      trend,
      confidence,
      stale,
      requiredForAction: spec?.requiredForAction === true
    });
  }

  const staleVariables = estimates
    .filter((estimate) => estimate.stale)
    .map((estimate) => estimate.variable);
  const staleRequiredVariables = estimates
    .filter((estimate) => estimate.stale && estimate.requiredForAction)
    .map((estimate) => estimate.variable);
  const estimatedVariables = new Set(estimates.map((estimate) => estimate.variable));
  const unknownRequiredVariables = specs
    .filter((spec) =>
      spec.requiredForAction === true &&
      (!estimatedVariables.has(spec.variable) || invalidObservationVariables.has(spec.variable))
    )
    .map((spec) => spec.variable);

  return {
    estimates,
    staleVariables,
    staleRequiredVariables,
    unknownRequiredVariables,
    extrapolationPerformed: false,
    futureStateInvented: false
  };
}
