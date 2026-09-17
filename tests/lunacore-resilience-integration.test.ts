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
    statedPurpose: "act physically only when required subsystems are healthy",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical resilience integration", () => {
  it("returns to observation when a required subsystem becomes unavailable", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "flow" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" }
      },
      physicalSubsystems: [
        { name: "required-control", status: "unavailable", requiredForAction: true }
      ],
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

    expect(result.physicalResilience?.actionReady).toBe(false);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.humanReviewRequired).toBe(true);
  });
});
