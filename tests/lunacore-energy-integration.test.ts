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
    statedPurpose: "preserve shelter and energy while interacting physically",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore physical energy integration", () => {
  it("returns to observation when optional physical demand conflicts with resource conservation", () => {
    const result = runLunaCore({
      support,
      resources: {
        shelterState: "secure",
        energy: {
          renewableGeneration: 4,
          essentialConsumption: 4,
          optionalConsumption: 1,
          reserve: 4,
          minimumReserve: 5
        }
      },
      physical: {
        outputChannels: [{ name: "flow" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" }
      },
      physicalEnergyDemand: { amount: 1 },
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1 }]
      },
      physicalOutput: {
        preferredChannel: "flow",
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

    expect(result.physicalEnergy?.status).toBe("conserve");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
  });

  it("allows represented surplus energy to clear the resource gate", () => {
    const result = runLunaCore({
      support,
      resources: {
        shelterState: "secure",
        energy: {
          renewableGeneration: 8,
          essentialConsumption: 3,
          optionalConsumption: 1,
          reserve: 10,
          minimumReserve: 5
        }
      },
      physical: {
        outputChannels: [{ name: "flow" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" }
      },
      physicalEnergyDemand: { amount: 2 },
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1 }]
      },
      physicalOutput: {
        preferredChannel: "flow",
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

    expect(result.physicalEnergy?.status).toBe("ready");
    expect(result.physicalOutput?.status).toBe("ready");
  });
});
