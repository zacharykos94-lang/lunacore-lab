import { describe, expect, it } from "vitest";
import { evaluatePhysicalConstraints } from "../src/core/physical-constraints.js";

describe("Physical Constraints", () => {
  it("does not invent missing constraints", () => {
    const result = evaluatePhysicalConstraints([
      { variable: "pressure", currentValue: 1, proposedValue: 2 }
    ]);

    expect(result.status).toBe("unknown");
    expect(result.constraintsInvented).toBe(false);
  });

  it("accepts a proposal inside the supplied envelope", () => {
    const result = evaluatePhysicalConstraints(
      [{ variable: "position", currentValue: 2, proposedValue: 2.5 }],
      [{ variable: "position", minimum: 0, maximum: 5, maximumChange: 1 }]
    );

    expect(result.status).toBe("within-envelope");
    expect(result.violations).toHaveLength(0);
  });

  it("blocks a hard constraint violation", () => {
    const result = evaluatePhysicalConstraints(
      [{ variable: "load", currentValue: 2, proposedValue: 9 }],
      [{ variable: "load", maximum: 5, hard: true }]
    );

    expect(result.status).toBe("blocked");
    expect(result.violations[0]?.constraint).toBe("maximum");
  });

  it("requests review for a soft conflict", () => {
    const result = evaluatePhysicalConstraints(
      [{ variable: "rate", currentValue: 1, proposedValue: 4 }],
      [{ variable: "rate", maximumChange: 1, hard: false }]
    );

    expect(result.status).toBe("review");
    expect(result.physicalActionRequiresAuthorization).toBe(true);
  });
});
