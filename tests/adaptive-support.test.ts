import { describe, expect, it } from "vitest";
import { chooseAdaptiveSupport } from "../src/core/adaptive-support.js";

describe("Adaptive Support", () => {
  it("uses context and purpose to shape ordinary support", () => {
    const result = chooseAdaptiveSupport({
      risk: {
        likelihood: 0.2,
        severity: 3,
        reversibility: 0.9,
        uncertainty: 0.2
      },
      context: {
        currentNeed: "planning",
        history: [
          {
            label: "previous planning success",
            relevance: 0.8,
            confidence: 0.9
          }
        ]
      },
      purpose: {
        statedPurpose: "complete the project safely",
        clarity: 0.9,
        alignment: 0.9
      }
    });

    expect(result.contextWeight).toBeGreaterThan(0.5);
    expect(result.purposeWeight).toBeGreaterThan(0.5);
    expect(result.strategy).toBe("context-and-purpose");
    expect(result.purposeVisible).toBe(true);
    expect(result.safetyOverridesPurpose).toBe(false);
  });

  it("keeps purpose visible while safety remains authoritative", () => {
    const result = chooseAdaptiveSupport({
      risk: {
        likelihood: 0.1,
        severity: 10,
        reversibility: 0.1,
        uncertainty: 0.8
      },
      context: {
        history: []
      },
      purpose: {
        statedPurpose: "keep moving forward",
        clarity: 1,
        alignment: 1
      }
    });

    expect(result.level).toBe("safety-support");
  expect(result.purposeVisible).toBe(true);
  expect(result.safetyOverridesPurpose).toBe(true);
  });

  it("uses history without treating history as destiny", () => {
    const result = chooseAdaptiveSupport({
      risk: {
        likelihood: 0.1,
        severity: 2,
        reversibility: 0.9,
        uncertainty: 0.1
      },
      context: {
        history: [
          {
            label: "past difficulty",
            relevance: 1,
            confidence: 0.6
          }
        ]
      },
      purpose: {
        statedPurpose: "try a different approach",
        clarity: 0.8,
        alignment: 0.9
      }
    });

    expect(result.contextWeight).toBeGreaterThan(0);
    expect(result.level).not.toBe("safety-support");
    expect(result.purposeVisible).toBe(true);
  });
});