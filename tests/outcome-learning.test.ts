import { describe, expect, it } from "vitest";
import { chooseAdaptiveSupport } from "../src/core/adaptive-support.js";
import { summarizeOutcomes } from "../src/core/outcome-learning.js";

describe("Outcome Learning", () => {
  it("does not turn one event into destiny", () => {
    const result = summarizeOutcomes([
      {
        label: "one difficult outcome",
        outcome: "harmful",
        relevance: 1,
        confidence: 1
      }
    ]);

    expect(result.evidenceStrength).toBeLessThan(1);
    expect(result.identityLabelAllowed).toBe(false);
    expect(result.automaticAuthorityChange).toBe(false);
  });

  it("can reinforce a repeated helpful pattern without gaining authority", () => {
    const result = summarizeOutcomes([
      { label: "helpful 1", outcome: "helpful", relevance: 1, confidence: 1 },
      { label: "helpful 2", outcome: "helpful", relevance: 0.9, confidence: 1 },
      { label: "helpful 3", outcome: "helpful", relevance: 1, confidence: 0.9 }
    ]);

    expect(result.advisory).toBe("reinforce-current-pattern");
    expect(result.automaticAuthorityChange).toBe(false);
  });

  it("flags repeated harmful outcomes for review rather than silently escalating control", () => {
    const result = summarizeOutcomes([
      { label: "miss 1", outcome: "harmful", relevance: 1, confidence: 1 },
      { label: "miss 2", outcome: "harmful", relevance: 0.9, confidence: 1 },
      { label: "miss 3", outcome: "harmful", relevance: 1, confidence: 0.9 }
    ]);

    expect(result.advisory).toBe("review-assumption");
    expect(result.strongerControlRequiresHumanReview).toBe(true);
    expect(result.automaticAuthorityChange).toBe(false);
  });

  it("keeps the current risk decision authoritative even when learning requests review", () => {
    const result = chooseAdaptiveSupport({
      risk: {
        likelihood: 0.05,
        severity: 2,
        reversibility: 1,
        uncertainty: 0
      },
      context: { history: [] },
      purpose: { clarity: 0, alignment: 0 },
      outcomes: [
        { label: "miss 1", outcome: "harmful", relevance: 1, confidence: 1 },
        { label: "miss 2", outcome: "harmful", relevance: 1, confidence: 1 },
        { label: "miss 3", outcome: "harmful", relevance: 1, confidence: 1 }
      ]
    });

    expect(result.level).toBe("presence");
    expect(result.learning.advisory).toBe("review-assumption");
    expect(result.learning.automaticAuthorityChange).toBe(false);
  });
});
