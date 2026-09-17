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
    statedPurpose: "act only on fresh physical information",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical change integration", () => {
  it("blocks a state-changing output when a required physical variable is stale", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "flow" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" }
      },
      physicalTimeline: [
        { variable: "pressure", value: 1, observedAt: 1, confidence: 0.9 }
      ],
      physicalChangeSpecs: [
        { variable: "pressure", staleAfter: 2, requiredForAction: true }
      ],
      physicalCurrentTime: 10,
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1 }]
      },
      physicalOutput: {
        preferredChannel: "flow",
        requestedScale: 0.3,
        changesPhysicalState: true
      },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        explicitHumanApproval: true
      }
    });

    expect(result.physicalChange?.staleRequiredVariables).toContain("pressure");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.humanReviewRequired).toBe(true);
  });
});
