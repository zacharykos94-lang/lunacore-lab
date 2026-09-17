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
    statedPurpose: "make a bounded physical change",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical constraint integration", () => {
  it("prevents a state-changing output when a hard physical constraint is violated", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "flow", available: true }],
        equilibrium: { stability: 0.9, confidence: 0.9 },
        environment: { medium: "water" }
      },
      physicalFeedback: {
        observations: [{ name: "state", value: 8, confidence: 0.9 }],
        desiredRegions: [{ name: "state", maximum: 5 }]
      },
      physicalTransitions: [
        { variable: "pressure", currentValue: 2, proposedValue: 9 }
      ],
      physicalConstraints: [
        { variable: "pressure", maximum: 5, hard: true }
      ],
      physicalOutput: {
        preferredChannel: "flow",
        requestedScale: 0.4,
        changesPhysicalState: true
      },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        explicitHumanApproval: true
      }
    });

    expect(result.physicalConstraints?.status).toBe("blocked");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalOutput?.outputScale).toBe(0);
    expect(result.humanReviewRequired).toBe(true);
  });
});
