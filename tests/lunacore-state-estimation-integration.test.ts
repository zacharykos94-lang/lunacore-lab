import { describe, expect, it } from "vitest";
import { runLunaCore } from "../src/core/lunacore.js";

const support = {
  risk: {
    likelihood: 0.1,
    severity: 2,
    reversibility: 0.9,
    uncertainty: 0.1
  },
  context: { history: [] },
  purpose: {
    statedPurpose: "maintain physical state",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore state estimation integration", () => {
  it("can feed fused physical state into the feedback layer", () => {
    const result = runLunaCore({
      support,
      physical: {
        equilibrium: { stability: 0.9, confidence: 0.9 },
        environment: { medium: "water", uncertainty: 0.1 }
      },
      physicalMeasurements: [
        { variable: "depth", source: "pressure", value: 7.5, confidence: 0.9 },
        { variable: "depth", source: "visual", value: 8, confidence: 0.8 }
      ],
      physicalVariableSpecs: [
        { variable: "depth", conflictTolerance: 1 }
      ],
      physicalFeedback: {
        desiredRegions: [{ name: "depth", maximum: 5 }]
      }
    });

    expect(result.physicalState?.estimates[0]?.conflicting).toBe(false);
    expect(result.physicalFeedback?.disposition).toBe("adjust");
    expect(result.physicalFeedback?.directActuationSpecified).toBe(false);
    expect(result.humanReviewRequired).toBe(true);
  });

  it("lets sensor disagreement reduce confidence enough to favor observation", () => {
    const result = runLunaCore({
      support,
      physicalMeasurements: [
        { variable: "position", source: "sensor-a", value: 1, confidence: 0.7 },
        { variable: "position", source: "sensor-b", value: 8, confidence: 0.7 }
      ],
      physicalVariableSpecs: [
        { variable: "position", conflictTolerance: 1 }
      ],
      physicalFeedback: {
        desiredRegions: [{ name: "position", target: 4, tolerance: 0.2 }]
      }
    });

    expect(result.physicalState?.conflictingVariables).toEqual(["position"]);
    expect(result.physicalFeedback?.confidence).toBeLessThan(0.4);
    expect(result.physicalFeedback?.disposition).toBe("observe");
  });
});
