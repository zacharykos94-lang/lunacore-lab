import { describe, expect, it } from "vitest";
import { evaluatePhysicalFeedback } from "../src/core/physical-feedback.js";

describe("Physical Feedback", () => {
  it("observes when state confidence is too low", () => {
    const result = evaluatePhysicalFeedback({
      observations: [{ name: "state-a", value: 1, confidence: 0.2 }],
      desiredRegions: [{ name: "state-a", target: 2, tolerance: 0.1 }]
    });

    expect(result.disposition).toBe("observe");
    expect(result.adjustmentScale).toBe(0);
    expect(result.physicalActionRequiresAuthorization).toBe(false);
  });

  it("prioritizes stabilization before optional adjustment", () => {
    const result = evaluatePhysicalFeedback({
      readiness: "stabilize",
      observations: [{ name: "orientation", value: 0.4, confidence: 0.9 }],
      desiredRegions: [{ name: "orientation", target: 0.5, tolerance: 0.02 }],
      environmentalUncertainty: 0.1
    });

    expect(result.disposition).toBe("stabilize");
    expect(result.adjustmentScale).toBeGreaterThan(0);
    expect(result.adjustmentScale).toBeLessThanOrEqual(0.5);
    expect(result.physicalActionRequiresAuthorization).toBe(true);
    expect(result.directActuationSpecified).toBe(false);
  });

  it("holds when represented state is inside the desired region", () => {
    const result = evaluatePhysicalFeedback({
      observations: [{ name: "level", value: 5, confidence: 0.9 }],
      desiredRegions: [{ name: "level", minimum: 4, maximum: 6 }]
    });

    expect(result.disposition).toBe("hold");
    expect(result.deviations).toHaveLength(0);
    expect(result.physicalActionRequiresAuthorization).toBe(false);
  });

  it("recommends only a bounded adjustment when state is outside the region", () => {
    const result = evaluatePhysicalFeedback({
      observations: [{ name: "position-x", value: 8, confidence: 0.95 }],
      desiredRegions: [{ name: "position-x", maximum: 5 }],
      environmentalUncertainty: 0.1,
      changeCost: 0.2
    });

    expect(result.disposition).toBe("adjust");
    expect(result.deviations).toHaveLength(1);
    expect(result.adjustmentScale).toBeGreaterThan(0);
    expect(result.adjustmentScale).toBeLessThanOrEqual(0.5);
    expect(result.reobserveAfterChange).toBe(true);
    expect(result.directActuationSpecified).toBe(false);
  });
});
