import { describe, expect, it } from "vitest";
import { evaluatePhysicalInterface } from "../src/core/physical-interface.js";

describe("Physical Interface", () => {
  it("treats visual input and output as ordinary extensible channels", () => {
    const result = evaluatePhysicalInterface({
      sensoryInputs: [
        { name: "visual", available: true },
        { name: "pressure", available: true }
      ],
      outputChannels: [
        { name: "visual", available: true },
        { name: "flow", available: true }
      ],
      equilibrium: { stability: 0.9, confidence: 0.8 },
      environment: { medium: "water", referenceFrame: "local" }
    });

    expect(result.visualInputAvailable).toBe(true);
    expect(result.visualOutputAvailable).toBe(true);
    expect(result.medium).toBe("water");
    expect(result.readiness).toBe("ready");
  });

  it("prioritizes equilibrium before optional movement", () => {
    const result = evaluatePhysicalInterface({
      equilibrium: { stability: 0.2 },
      environment: { medium: "unspecified" },
      intent: { movementRequested: true }
    });

    expect(result.readiness).toBe("stabilize");
    expect(result.physicalActionRequiresAuthorization).toBe(true);
  });

  it("observes when physical state is incomplete", () => {
    const result = evaluatePhysicalInterface({
      sensoryInputs: [{ name: "visual" }]
    });

    expect(result.readiness).toBe("observe");
    expect(result.environmentKnown).toBe(false);
  });

  it("keeps movement and interaction mechanism-agnostic", () => {
    const result = evaluatePhysicalInterface({
      equilibrium: { stability: 0.8 },
      environment: { medium: "future-medium" },
      intent: {
        goal: "change position relative to the environment",
        movementRequested: true,
        interactionRequested: true
      }
    });

    expect(result.medium).toBe("future-medium");
    expect(result.movementRequested).toBe(true);
    expect(result.interactionRequested).toBe(true);
  });
});
