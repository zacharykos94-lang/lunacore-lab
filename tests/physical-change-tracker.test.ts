import { describe, expect, it } from "vitest";
import { evaluatePhysicalChange } from "../src/core/physical-change-tracker.js";

describe("Physical Change Tracker", () => {
  it("calculates change rate only from represented observations", () => {
    const result = evaluatePhysicalChange([
      { variable: "level", value: 2, observedAt: 10, confidence: 0.9 },
      { variable: "level", value: 4, observedAt: 12, confidence: 0.8 }
    ]);

    const estimate = result.estimates[0];
    expect(estimate?.delta).toBe(2);
    expect(estimate?.elapsed).toBe(2);
    expect(estimate?.rate).toBe(1);
    expect(estimate?.trend).toBe("increasing");
    expect(result.extrapolationPerformed).toBe(false);
    expect(result.futureStateInvented).toBe(false);
  });

  it("marks required stale variables without predicting their current value", () => {
    const result = evaluatePhysicalChange(
      [{ variable: "pressure", value: 1, observedAt: 5, confidence: 0.9 }],
      [{ variable: "pressure", staleAfter: 2, requiredForAction: true }],
      10
    );

    expect(result.staleVariables).toContain("pressure");
    expect(result.staleRequiredVariables).toContain("pressure");
    expect(result.estimates[0]?.rate).toBe(null);
  });

  it("supports a configurable stability band", () => {
    const result = evaluatePhysicalChange(
      [
        { variable: "orientation", value: 1, observedAt: 1 },
        { variable: "orientation", value: 1.02, observedAt: 2 }
      ],
      [{ variable: "orientation", stableDelta: 0.05 }]
    );

    expect(result.estimates[0]?.trend).toBe("stable");
  });
});
