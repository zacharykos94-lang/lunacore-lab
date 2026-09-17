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
    statedPurpose: "change physical state only with represented capability",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore capability integration", () => {
  it("returns to observation when a required physical capability is unavailable", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "future-output" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "unspecified" }
      },
      physicalCapabilities: [
        { name: "sense-only", roles: ["sense"], confidence: 0.9 }
      ],
      physicalCapabilityRequirements: [
        { role: "state-change", requiredForAction: true }
      ],
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1 }]
      },
      physicalOutput: {
        preferredChannel: "future-output",
        requestedScale: 0.2,
        changesPhysicalState: true
      },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        explicitHumanApproval: true
      }
    });

    expect(result.physicalCapabilities?.actionReady).toBe(false);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.humanReviewRequired).toBe(true);
  });
});
