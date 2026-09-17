import { describe, expect, it } from "vitest";
import { evaluatePhysicalCapabilities } from "../src/core/physical-capabilities.js";

describe("Physical Capabilities", () => {
  it("does not assume an embodiment when none is represented", () => {
    const result = evaluatePhysicalCapabilities();

    expect(result.status).toBe("unknown");
    expect(result.capabilityAssumed).toBe(false);
    expect(result.mechanismSelected).toBe(false);
  });

  it("recognizes a satisfied abstract capability requirement", () => {
    const result = evaluatePhysicalCapabilities(
      [
        {
          name: "medium-control",
          roles: ["state-change"],
          confidence: 0.9,
          medium: "water"
        }
      ],
      [
        {
          role: "state-change",
          minimumConfidence: 0.7,
          requiredForAction: true
        }
      ]
    );

    expect(result.status).toBe("ready");
    expect(result.actionReady).toBe(true);
  });

  it("blocks action readiness when a required role is unavailable", () => {
    const result = evaluatePhysicalCapabilities(
      [{ name: "vision", roles: ["sense"], confidence: 0.9 }],
      [{ role: "stabilize", requiredForAction: true }]
    );

    expect(result.status).toBe("unavailable");
    expect(result.unmetRequirements).toContain("stabilize");
    expect(result.actionReady).toBe(false);
  });

  it("marks low-confidence capability as degraded without inventing a replacement", () => {
    const result = evaluatePhysicalCapabilities(
      [{ name: "future-control", roles: ["state-change"], confidence: 0.3 }],
      [
        {
          role: "state-change",
          minimumConfidence: 0.8,
          requiredForAction: true
        }
      ]
    );

    expect(result.status).toBe("degraded");
    expect(result.degradedRequirements).toContain("state-change");
    expect(result.actionReady).toBe(false);
    expect(result.mechanismSelected).toBe(false);
  });
});
