import { describe, expect, it } from "vitest";
import { evaluatePhysicalResilience } from "../src/core/physical-resilience.js";

describe("Physical Resilience", () => {
  it("does not assume readiness without subsystem health evidence", () => {
    const result = evaluatePhysicalResilience();

    expect(result.mode).toBe("observe");
    expect(result.actionReady).toBe(false);
    expect(result.automaticRecoveryAttempted).toBe(false);
    expect(result.failedSubsystemBypassed).toBe(false);
  });

  it("returns to observation when a required subsystem is unavailable", () => {
    const result = evaluatePhysicalResilience([
      { name: "stability-loop", status: "unavailable", requiredForAction: true }
    ]);

    expect(result.mode).toBe("observe");
    expect(result.actionReady).toBe(false);
    expect(result.unavailableSubsystems).toContain("stability-loop");
  });

  it("preserves degraded operation without calling it normal", () => {
    const result = evaluatePhysicalResilience([
      { name: "secondary-sense", status: "degraded" },
      { name: "primary-control", status: "nominal", requiredForAction: true }
    ]);

    expect(result.mode).toBe("degraded");
    expect(result.actionReady).toBe(true);
    expect(result.degradedSubsystems).toContain("secondary-sense");
  });

  it("does not automatically bypass failed subsystems", () => {
    const result = evaluatePhysicalResilience([
      { name: "required-control", status: "unavailable", requiredForAction: true }
    ]);

    expect(result.failedSubsystemBypassed).toBe(false);
    expect(result.automaticRecoveryAttempted).toBe(false);
  });
});
