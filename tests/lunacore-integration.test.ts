import { describe, expect, it } from "vitest";
import { runLunaCore } from "../src/core/lunacore.js";

describe("LunaCore v0.2 integration", () => {
  it("composes support, resources, provenance, and read-only authorization", () => {
    const result = runLunaCore({
      support: {
        risk: {
          likelihood: 0.1,
          severity: 2,
          reversibility: 0.9,
          uncertainty: 0.1
        },
        context: { history: [] },
        purpose: {
          statedPurpose: "observe before acting",
          clarity: 1,
          alignment: 1
        },
        engagement: {
          observationValue: 0.9,
          hasConcreteTask: false
        },
        trace: {
          evidence: [
            {
              label: "human asked to observe",
              basis: "human-statement",
              confidence: 1
            }
          ]
        }
      },
      resources: {
        shelterState: "secure",
        energy: {
          renewableGeneration: 8,
          essentialConsumption: 4,
          optionalConsumption: 1,
          reserve: 10,
          minimumReserve: 5
        }
      },
      action: {
        actionClass: "analysis",
        externalEffect: false
      }
    });

    expect(result.support.engagementMode).toBe("strategic-stillness");
    expect(result.support.trace.exposesPrivateReasoning).toBe(false);
    expect(result.resources?.renewableShare).toBe(1);
    expect(result.authorization?.authorized).toBe(true);
    expect(result.humanReviewRequired).toBe(false);
  });

  it("surfaces approval requirements without converting them into permission", () => {
    const result = runLunaCore({
      support: {
        risk: {
          likelihood: 0.1,
          severity: 2,
          reversibility: 0.9,
          uncertainty: 0.1
        },
        context: { history: [] },
        purpose: { statedPurpose: "plan", clarity: 1, alignment: 1 }
      },
      action: {
        actionClass: "physical-infrastructure",
        externalEffect: true,
        reversible: false
      }
    });

    expect(result.authorization?.status).toBe("approval-required");
    expect(result.authorization?.authorized).toBe(false);
    expect(result.authorization?.recommendationIsAuthorization).toBe(false);
    expect(result.humanReviewRequired).toBe(true);
  });
});
