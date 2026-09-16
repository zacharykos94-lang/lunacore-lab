import { describe, expect, it } from "vitest";
import { chooseSupport } from "../src/core/active-support.js";

describe("Active Support", () => {
  it("preserves user agency when risk is low", () => {
    const result = chooseSupport({
      likelihood: 0.05,
      severity: 2,
      reversibility: 0.9,
      uncertainty: 0.1
    });

    expect(result.level).toBe("presence");
  });

  it("responds strongly to rare but extreme harm", () => {
    const result = chooseSupport({
      likelihood: 0.08,
      severity: 10,
      reversibility: 0.1,
      uncertainty: 0.8
    });

    expect(result.level).toBe("safety-support");
  });
});