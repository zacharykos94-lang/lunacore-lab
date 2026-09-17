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
    statedPurpose: "maintain a stable physical state",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical feedback integration", () => {
  it("requires authorization before a feedback adjustment can affect the world", () => {
    const result = runLunaCore({
      support,
      physical: {
        equilibrium: { stability: 0.9, confidence: 0.9 },
        environment: { medium: "water", uncertainty: 0.1 }
      },
      physicalFeedback: {
        observations: [{ name: "depth", value: 8, confidence: 0.9 }],
        desiredRegions: [{ name: "depth", maximum: 5 }]
      }
    });

    expect(result.physicalFeedback?.disposition).toBe("adjust");
    expect(result.physicalFeedback?.directActuationSpecified).toBe(false);
    expect(result.humanReviewRequired).toBe(true);
  });

  it("allows a bounded reversible adjustment under scoped delegation", () => {
    const result = runLunaCore({
      support,
      physical: {
        equilibrium: { stability: 0.9, confidence: 0.9 },
        environment: { medium: "water", uncertainty: 0.1 }
      },
      physicalFeedback: {
        observations: [{ name: "depth", value: 8, confidence: 0.9 }],
        desiredRegions: [{ name: "depth", maximum: 5 }]
      },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        activeDelegation: true,
        delegationAllowsAction: true
      }
    });

    expect(result.authorization?.authorized).toBe(true);
    expect(result.physicalFeedback?.adjustmentScale).toBeLessThanOrEqual(0.5);
    expect(result.physicalFeedback?.reobserveAfterChange).toBe(true);
    expect(result.humanReviewRequired).toBe(false);
  });
});
