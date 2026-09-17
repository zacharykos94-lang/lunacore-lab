import { describe, expect, it } from "vitest";
import { estimatePhysicalState } from "../src/core/physical-state-estimator.js";
import { evaluatePhysicalFeedback } from "../src/core/physical-feedback.js";
import { evaluatePhysicalConstraints } from "../src/core/physical-constraints.js";
import { evaluatePhysicalChange } from "../src/core/physical-change-tracker.js";
import { evaluatePhysicalCapabilities } from "../src/core/physical-capabilities.js";
import { evaluatePhysicalEnergyDemand } from "../src/core/physical-energy.js";
import { evaluatePhysicalOutput } from "../src/core/physical-output.js";
import { evaluatePhysicalInterface } from "../src/core/physical-interface.js";
import { queryPhysicalWorldModel } from "../src/core/physical-world-model.js";
import { runLunaCore } from "../src/core/lunacore.js";

const nonFinite = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

const support = {
  risk: { likelihood: 0.1, severity: 2, reversibility: 0.9, uncertainty: 0.1 },
  context: { history: [] },
  purpose: { statedPurpose: "test physical boundaries", clarity: 1, alignment: 1 }
};

describe("physical numeric hardening", () => {
  it.each(nonFinite)("does not estimate malformed state value %s", (value) => {
    const result = estimatePhysicalState([
      { variable: "state", source: "sensor", value, confidence: 1 }
    ]);

    expect(result.estimates).toEqual([]);
    expect(result.invalidVariables).toEqual(["state"]);
  });

  it("degrades malformed confidence and feedback inputs to observation", () => {
    const state = estimatePhysicalState([
      { variable: "state", source: "sensor", value: 1, confidence: Number.NaN }
    ]);
    expect(state.estimates[0]?.confidence).toBe(0);

    const feedback = evaluatePhysicalFeedback({
      observations: [{ name: "state", value: 0, confidence: 1 }],
      desiredRegions: [{ name: "state", target: Number.POSITIVE_INFINITY }]
    });
    expect(feedback.disposition).toBe("observe");
    expect(feedback.adjustmentScale).toBe(0);
  });

  it("does not treat malformed equilibrium or environment confidence as ready", () => {
    const equilibrium = evaluatePhysicalInterface({
      equilibrium: { stability: 1, confidence: Number.NaN },
      environment: { medium: "unspecified" }
    });
    const environment = evaluatePhysicalInterface({
      equilibrium: { stability: 1 },
      environment: { medium: "unspecified", uncertainty: Number.POSITIVE_INFINITY }
    });
    expect(equilibrium.readiness).toBe("observe");
    expect(environment.readiness).toBe("observe");
  });

  it("does not turn a malformed-confidence relation into a known path", () => {
    const result = queryPhysicalWorldModel({
      entities: [{ id: "a" }, { id: "b" }],
      relations: [{ from: "a", to: "b", relation: "connected", transition: "allowed", confidence: Number.NaN }]
    }, { fromEntityId: "a", toEntityId: "b" });
    expect(result.reachable).toBe(null);
  });

  it.each(nonFinite)("requires review for malformed proposed value %s", (value) => {
    const result = evaluatePhysicalConstraints(
      [{ variable: "load", currentValue: 1, proposedValue: value }],
      [{ variable: "load", maximum: 5, hard: true }]
    );
    expect(result.status).toBe("review");
  });

  it("keeps required change state unknown when its measurements are malformed or missing", () => {
    const result = evaluatePhysicalChange(
      [{ variable: "pressure", value: Number.NaN, observedAt: 1 }],
      [{ variable: "pressure", staleAfter: 2, requiredForAction: true }],
      3
    );
    expect(result.estimates).toEqual([]);
    expect(result.unknownRequiredVariables).toEqual(["pressure"]);
  });

  it("does not satisfy a required capability with malformed confidence", () => {
    const result = evaluatePhysicalCapabilities(
      [{ name: "change", roles: ["state-change"], confidence: Number.NaN }],
      [{ role: "state-change", minimumConfidence: 0.5, requiredForAction: true }]
    );
    expect(result.actionReady).toBe(false);
    expect(result.status).toBe("degraded");
  });

  it.each(nonFinite)("treats malformed energy demand %s as unknown", (amount) => {
    const result = evaluatePhysicalEnergyDemand({ amount });
    expect(result.status).toBe("unknown");
    expect(result.actionReady).toBe(false);
  });

  it("does not mark malformed output scale ready", () => {
    const result = evaluatePhysicalOutput(
      { purpose: "change", requestedScale: Number.NaN, changesPhysicalState: true },
      { availableChannels: ["field"], feedbackDisposition: "adjust", authorized: true }
    );
    expect(result.status).toBe("observe");
    expect(result.outputScale).toBe(0);
  });

  it("prevents cross-layer READY when constraints require review", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "field" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "unspecified" }
      },
      physicalFeedback: {
        observations: [{ name: "state", value: 0, confidence: 0.9 }],
        desiredRegions: [{ name: "state", target: 1 }]
      },
      physicalTransitions: [{ variable: "load", proposedValue: Number.NaN }],
      physicalConstraints: [{ variable: "load", maximum: 5, hard: true }],
      physicalOutput: {
        preferredChannel: "field",
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

    expect(result.physicalConstraints?.status).toBe("review");
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.status).toBe("review");
  });

  it("prevents malformed state from increasing integrated readiness", () => {
    const result = runLunaCore({
      support,
      physical: {
        outputChannels: [{ name: "field" }],
        equilibrium: { stability: 0.9 },
        environment: { medium: "unspecified" }
      },
      physicalMeasurements: [
        { variable: "state", source: "sensor", value: Number.POSITIVE_INFINITY, confidence: 1 }
      ],
      physicalFeedback: { desiredRegions: [{ name: "state", target: 1 }] },
      physicalOutput: { preferredChannel: "field", changesPhysicalState: true },
      action: {
        actionClass: "physical-interaction",
        externalEffect: true,
        reversible: true,
        explicitHumanApproval: true
      }
    });

    expect(result.physicalState?.invalidVariables).toEqual(["state"]);
    expect(result.physicalOutput?.status).toBe("observe");
    expect(result.physicalReadiness.reviewSignals).toContain("physical-state-invalid");
    expect(result.physicalReadiness.status).toBe("review");
  });
});
