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
    statedPurpose: "interact with the physical environment",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical output integration", () => {
  it("can represent visual output without treating vision as a privileged mechanism", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [
          { name: "visual", available: true },
          { name: "acoustic", available: true }
        ]
      },
      physicalOutput: {
        preferredChannel: "visual",
        requestedScale: 0.2,
        changesPhysicalState: false
      },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        activeDelegation: true,
        delegationAllowsAction: true
      }
    });

    expect(result.physical?.visualOutputAvailable).toBe(true);
    expect(result.physicalOutput?.selectedChannel).toBe("visual");
    expect(result.physicalOutput?.status).toBe("ready");
    expect(result.physicalOutput?.mechanismSpecified).toBe(false);
  });

  it("keeps an external output blocked when authorization is missing", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "flow", available: true }]
      },
      physicalOutput: {
        preferredChannel: "flow",
        requestedScale: 0.2
      }
    });

    expect(result.physicalOutput?.status).toBe("approval-required");
    expect(result.humanReviewRequired).toBe(true);
  });
});
