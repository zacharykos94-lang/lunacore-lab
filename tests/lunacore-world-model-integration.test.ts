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
    statedPurpose: "interact carefully with a represented environment",
    clarity: 1,
    alignment: 1
  }
};

describe("LunaCore world-model integration", () => {
  it("allows an authorized abstract state-changing output when a represented path exists", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "flow" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "water" }
      },
      physicalWorld: {
        entities: [{ id: "origin" }, { id: "target" }],
        relations: [
          {
            from: "origin",
            to: "target",
            relation: "connected-through-medium",
            transition: "allowed",
            confidence: 0.9
          }
        ]
      },
      physicalWorldQuery: {
        fromEntityId: "origin",
        toEntityId: "target"
      },
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1, tolerance: 0.1 }],
        environmentalUncertainty: 0.1
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
        activeDelegation: true,
        delegationAllowsAction: true
      }
    });

    expect(result.physicalWorldQuery?.reachable).toBe(true);
    expect(result.physicalOutput?.status).toBe("ready");
    expect(result.physicalOutput?.mechanismSpecified).toBe(false);
    expect(result.humanReviewRequired).toBe(false);
  });

  it("falls back to observation when a requested spatial transition is not represented", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "future-medium-control" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "unspecified" }
      },
      physicalWorld: {
        entities: [{ id: "origin" }, { id: "target" }]
      },
      physicalWorldQuery: {
        fromEntityId: "origin",
        toEntityId: "target"
      },
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1, tolerance: 0.1 }]
      },
      physicalOutput: {
        preferredChannel: "future-medium-control",
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

    expect(result.physicalWorldQuery?.reachable).toBe(null);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.humanReviewRequired).toBe(true);
  });
});
