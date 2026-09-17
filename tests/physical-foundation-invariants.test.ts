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
    statedPurpose: "interact with the physical world conservatively",
    clarity: 1,
    alignment: 1
  }
};

const basePhysical = {
  outputChannels: [{ name: "flow" }],
  equilibrium: { stability: 0.9 },
  environment: { medium: "water" }
};

const baseFeedback = {
  observations: [{ name: "state", value: 0, confidence: 0.9 }],
  desiredRegions: [{ name: "state", target: 1, tolerance: 0.1 }]
};

const baseOutput = {
  preferredChannel: "flow",
  requestedScale: 0.2,
  changesPhysicalState: true
};

const explicitApproval = {
  actionClass: "physical-interaction" as const,
  externalEffect: true,
  reversible: true,
  explicitHumanApproval: true
};

describe("LunaCore physical foundation invariants", () => {
  it("does not turn human permission into missing capability", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalCapabilities: [
        { name: "sense-only", roles: ["sense"], confidence: 0.9 }
      ],
      physicalCapabilityRequirements: [
        { role: "state-change", requiredForAction: true }
      ],
      physicalFeedback: baseFeedback,
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.authorization?.authorized).toBe(true);
    expect(result.physicalCapabilities?.actionReady).toBe(false);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
  });

  it("does not turn human permission into evidence that a spatial path exists", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalWorld: {
        entities: [{ id: "origin" }, { id: "target" }]
      },
      physicalWorldQuery: {
        fromEntityId: "origin",
        toEntityId: "target"
      },
      physicalFeedback: baseFeedback,
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.authorization?.authorized).toBe(true);
    expect(result.physicalWorldQuery?.reachable).toBe(null);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.reviewSignals).toContain(
      "spatial-transition-unknown"
    );
  });

  it("does not turn desire or permission into assumed energy supply", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalEnergyDemand: { amount: 1 },
      physicalFeedback: baseFeedback,
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.authorization?.authorized).toBe(true);
    expect(result.physicalEnergy?.status).toBe("unknown");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
  });

  it("keeps hard physical constraints authoritative over permission", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalFeedback: baseFeedback,
      physicalTransitions: [
        { variable: "load", currentValue: 1, proposedValue: 9 }
      ],
      physicalConstraints: [
        { variable: "load", maximum: 5, hard: true }
      ],
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.authorization?.authorized).toBe(true);
    expect(result.physicalConstraints?.status).toBe("blocked");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("blocked");
  });

  it("prefers observation when sensors materially disagree", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalMeasurements: [
        { variable: "state", source: "visual", value: 0, confidence: 0.9 },
        { variable: "state", source: "pressure", value: 1, confidence: 0.9 }
      ],
      physicalVariableSpecs: [
        { variable: "state", conflictTolerance: 0.2 }
      ],
      physicalFeedback: {
        desiredRegions: [{ name: "state", target: 1.5, tolerance: 0.1 }]
      },
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.physicalState?.conflictingVariables).toContain("state");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
    expect(result.physicalReadiness.reviewSignals).toContain("sensor-conflict");
    expect(result.humanReviewRequired).toBe(true);
  });

  it("does not silently bypass an unavailable required subsystem", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalSubsystems: [
        {
          name: "required-control",
          status: "unavailable",
          requiredForAction: true
        }
      ],
      physicalFeedback: baseFeedback,
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.physicalResilience?.failedSubsystemBypassed).toBe(false);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
  });

  it("can become ready without inventing a mechanism or new authority", () => {
    const result = runLunaCore({
      support,
      physical: basePhysical,
      physicalFeedback: baseFeedback,
      physicalOutput: baseOutput,
      action: explicitApproval
    });

    expect(result.physicalOutput?.status).toBe("ready");
    expect(result.physicalOutput?.mechanismSpecified).toBe(false);
    expect(result.physicalOutput?.directDeviceCommandSpecified).toBe(false);
    expect(result.physicalReadiness.status).toBe("ready");
    expect(result.physicalReadiness.mechanismAssumed).toBe(false);
    expect(result.physicalReadiness.newAuthorityGranted).toBe(false);
  });
});
