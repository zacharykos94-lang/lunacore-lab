import { describe, expect, it } from "vitest";
import { runLunaCore } from "../src/core/lunacore.js";

const baseSupport = {
  risk: {
    likelihood: 0.1,
    severity: 2,
    reversibility: 0.9,
    uncertainty: 0.1
  },
  context: { history: [] },
  purpose: {
    statedPurpose: "sense and move carefully",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical integration", () => {
  it("requires review when physical action is requested without authorization", () => {
    const result = runLunaCore({
      support: baseSupport,
      physical: {
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" },
        intent: { movementRequested: true }
      }
    });

    expect(result.physical?.readiness).toBe("ready");
    expect(result.humanReviewRequired).toBe(true);
  });

  it("allows scoped reversible physical interaction through delegation", () => {
    const result = runLunaCore({
      support: baseSupport,
      physical: {
        equilibrium: { stability: 0.9 },
        environment: { medium: "unspecified" },
        intent: { interactionRequested: true }
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
    expect(result.humanReviewRequired).toBe(false);
  });
});
