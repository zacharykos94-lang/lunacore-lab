import { describe, expect, it } from "vitest";
import { evaluatePhysicalOutput } from "../src/core/physical-output.js";

describe("Physical Output", () => {
  it("does not invent an unavailable preferred channel", () => {
    const result = evaluatePhysicalOutput(
      { preferredChannel: "visual", requestedScale: 0.4 },
      { availableChannels: ["acoustic"], authorized: true }
    );

    expect(result.status).toBe("unavailable");
    expect(result.selectedChannel).toBe(null);
    expect(result.directDeviceCommandSpecified).toBe(false);
    expect(result.mechanismSpecified).toBe(false);
  });

  it("requires authorization before external output", () => {
    const result = evaluatePhysicalOutput(
      { preferredChannel: "visual", requestedScale: 0.2 },
      { availableChannels: ["visual"], authorized: false }
    );

    expect(result.status).toBe("approval-required");
    expect(result.outputScale).toBe(0);
  });

  it("keeps state-changing output within the feedback bound", () => {
    const result = evaluatePhysicalOutput(
      {
        preferredChannel: "flow",
        requestedScale: 0.8,
        changesPhysicalState: true
      },
      {
        availableChannels: ["flow"],
        feedbackDisposition: "adjust",
        feedbackAdjustmentScale: 0.3,
        authorized: true
      }
    );

    expect(result.status).toBe("ready");
    expect(result.outputScale).toBe(0.3);
    expect(result.directDeviceCommandSpecified).toBe(false);
    expect(result.mechanismSpecified).toBe(false);
  });

  it("does not change physical state when feedback says hold", () => {
    const result = evaluatePhysicalOutput(
      {
        preferredChannel: "future-channel",
        requestedScale: 0.5,
        changesPhysicalState: true
      },
      {
        availableChannels: ["future-channel"],
        feedbackDisposition: "hold",
        authorized: true
      }
    );

    expect(result.status).toBe("observe");
    expect(result.outputScale).toBe(0);
  });
});
