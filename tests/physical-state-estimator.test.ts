import { describe, expect, it } from "vitest";
import { estimatePhysicalState } from "../src/core/physical-state-estimator.js";

describe("Physical State Estimator", () => {
  it("combines agreeing measurements without privileging a sensor type", () => {
    const result = estimatePhysicalState([
      { variable: "range", source: "visual", value: 10, confidence: 0.9 },
      { variable: "range", source: "acoustic", value: 10.4, confidence: 0.8 }
    ], [
      { variable: "range", conflictTolerance: 1 }
    ]);

    expect(result.estimates).toHaveLength(1);
    expect(result.estimates[0]?.conflicting).toBe(false);
    expect(result.estimates[0]?.sources).toEqual(["visual", "acoustic"]);
    expect(result.preferredSensorType).toBe(null);
  });

  it("preserves disagreement and lowers confidence when measurements conflict", () => {
    const result = estimatePhysicalState([
      { variable: "depth", source: "pressure", value: 4, confidence: 0.9 },
      { variable: "depth", source: "visual", value: 9, confidence: 0.9 }
    ], [
      { variable: "depth", conflictTolerance: 1 }
    ]);

    const estimate = result.estimates[0];
    expect(estimate?.conflicting).toBe(true);
    expect(estimate?.spread).toBe(5);
    expect(estimate?.confidence).toBeCloseTo(0.45);
    expect(result.conflictingVariables).toEqual(["depth"]);
    expect(result.preservesSourceDisagreement).toBe(true);
  });

  it("leaves conflict undefined unless the variable has a meaningful tolerance", () => {
    const result = estimatePhysicalState([
      { variable: "future-state", source: "sensor-a", value: 1, confidence: 0.7 },
      { variable: "future-state", source: "sensor-b", value: 3, confidence: 0.7 }
    ]);

    expect(result.estimates[0]?.conflicting).toBe(false);
    expect(result.estimates[0]?.spread).toBe(2);
  });
});
