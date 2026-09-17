import { describe, expect, it } from "vitest";
import { evaluatePhysicalReadiness } from "../src/core/physical-readiness.js";

describe("Physical Readiness", () => {
  it("reports blocked when a hard physical constraint blocks action", () => {
    const result = evaluatePhysicalReadiness({
      actionRequested: true,
      constraintStatus: "blocked"
    });

    expect(result.status).toBe("blocked");
    expect(result.representedGatesClear).toBe(false);
    expect(result.blockers).toContain("hard-physical-constraint");
    expect(result.newAuthorityGranted).toBe(false);
  });

  it("reports review when required physical evidence is stale", () => {
    const result = evaluatePhysicalReadiness({
      actionRequested: true,
      staleRequiredVariables: ["pressure"]
    });

    expect(result.status).toBe("review");
    expect(result.reviewSignals).toContain("required-state-stale");
  });

  it("reports stabilize before optional physical change", () => {
    const result = evaluatePhysicalReadiness({
      actionRequested: true,
      interfaceReadiness: "stabilize"
    });

    expect(result.status).toBe("stabilize");
    expect(result.representedGatesClear).toBe(false);
  });

  it("reports ready only when the represented output is ready and no earlier gate blocks it", () => {
    const result = evaluatePhysicalReadiness({
      actionRequested: true,
      interfaceReadiness: "ready",
      feedbackDisposition: "adjust",
      capabilityActionReady: true,
      resilienceActionReady: true,
      constraintStatus: "within-envelope",
      authorizationStatus: "allowed",
      outputStatus: "ready"
    });

    expect(result.status).toBe("ready");
    expect(result.representedGatesClear).toBe(true);
    expect(result.mechanismAssumed).toBe(false);
    expect(result.newAuthorityGranted).toBe(false);
  });
});
