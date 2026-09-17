import { describe, expect, it } from "vitest";
import { chooseEngagementMode } from "../src/core/engagement-mode.js";

describe("Engagement Mode", () => {
  it("allows leisure when risk is low", () => {
    expect(
      chooseEngagementMode({
        supportLevel: "presence",
        intent: "leisure"
      })
    ).toBe("leisure");
  });

  it("uses strategic stillness when observation has value", () => {
    expect(
      chooseEngagementMode({
        supportLevel: "presence",
        intent: "observe",
        observationValue: 0.9
      })
    ).toBe("strategic-stillness");
  });

  it("allows creative exploration without requiring productivity", () => {
    expect(
      chooseEngagementMode({
        supportLevel: "gentle-guidance",
        intent: "creative"
      })
    ).toBe("creative-exploration");
  });

  it("moves to action when safety support is required", () => {
    expect(
      chooseEngagementMode({
        supportLevel: "safety-support",
        intent: "leisure"
      })
    ).toBe("action");
  });
});
