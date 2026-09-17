import { describe, expect, it } from "vitest";
import { chooseAdaptiveSupport } from "../src/core/adaptive-support.js";
import { buildDecisionTrace } from "../src/core/provenance-trace.js";
import { summarizeOutcomes } from "../src/core/outcome-learning.js";

describe("Provenance and Decision Trace", () => {
  it("records structured evidence, inferences, and unknowns without private reasoning", () => {
    const learning = summarizeOutcomes([]);
    const trace = buildDecisionTrace({
      supportLevel: "presence",
      strategy: "presence-led",
      engagementMode: "strategic-stillness",
      learning,
      context: {
        evidence: [
          {
            label: "human requested time to observe",
            basis: "human-statement",
            confidence: 1.4
          }
        ],
        inferences: ["waiting may preserve optionality"],
        unknowns: ["future conditions may change"]
      }
    });

    expect(trace.evidence[0]?.confidence).toBe(1);
    expect(trace.inferences).toEqual(["waiting may preserve optionality"]);
    expect(trace.unknowns).toEqual(["future conditions may change"]);
    expect(trace.exposesPrivateReasoning).toBe(false);
    expect(trace.automaticAuthorityChange).toBe(false);
  });

  it("carries human-review requirements from bounded learning", () => {
    const result = chooseAdaptiveSupport({
      risk: {
        likelihood: 0.05,
        severity: 1,
        reversibility: 1,
        uncertainty: 0
      },
      context: { history: [] },
      purpose: { statedPurpose: "observe", clarity: 1, alignment: 1 },
      outcomes: [
        { label: "a", outcome: "harmful", relevance: 1, confidence: 1 },
        { label: "b", outcome: "harmful", relevance: 1, confidence: 1 },
        { label: "c", outcome: "harmful", relevance: 1, confidence: 1 }
      ]
    });

    expect(result.level).toBe("presence");
    expect(result.learning.advisory).toBe("review-assumption");
    expect(result.trace.humanReviewRequired).toBe(true);
    expect(result.trace.automaticAuthorityChange).toBe(false);
  });

  it("bounds trace evidence instead of accumulating an unlimited record", () => {
    const evidence = Array.from({ length: 30 }, (_, index) => ({
      label: `signal-${index}`,
      basis: "derived-measure" as const,
      confidence: 0.8
    }));

    const trace = buildDecisionTrace({
      supportLevel: "gentle-guidance",
      strategy: "context-aware",
      engagementMode: "presence",
      learning: summarizeOutcomes([]),
      context: { evidence }
    });

    expect(trace.evidence).toHaveLength(20);
  });
});
