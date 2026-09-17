import { describe, expect, it } from "vitest";
import { authorizeAction } from "../src/core/human-authorization.js";
import { evaluateResourceShelter } from "../src/core/resource-shelter.js";

describe("Human Authorization", () => {
  it("allows read-only analysis without extra approval", () => {
    const result = authorizeAction({
      actionClass: "analysis",
      externalEffect: false
    });

    expect(result.status).toBe("allowed");
    expect(result.authorized).toBe(true);
    expect(result.humanApprovalRequired).toBe(false);
    expect(result.recommendationIsAuthorization).toBe(false);
  });

  it("requires explicit approval for physical infrastructure", () => {
    const result = authorizeAction({
      actionClass: "physical-infrastructure",
      externalEffect: true,
      reversible: false,
      activeDelegation: true,
      delegationAllowsAction: true
    });

    expect(result.status).toBe("approval-required");
    expect(result.authorized).toBe(false);
    expect(result.humanApprovalRequired).toBe(true);
  });

  it("allows reversible delegated digital actions within scope", () => {
    const result = authorizeAction({
      actionClass: "digital-change",
      externalEffect: true,
      reversible: true,
      activeDelegation: true,
      delegationAllowsAction: true
    });

    expect(result.status).toBe("allowed");
    expect(result.authorized).toBe(true);
    expect(result.delegationIsRevocable).toBe(true);
  });

  it("never overrides an explicit human rejection", () => {
    const result = authorizeAction({
      actionClass: "communication",
      externalEffect: true,
      activeDelegation: true,
      delegationAllowsAction: true,
      humanRejected: true
    });

    expect(result.status).toBe("blocked");
    expect(result.authorized).toBe(false);
  });

  it("keeps shelter expansion locked until explicit physical approval exists", () => {
    const base = {
      shelterState: "secure" as const,
      energy: {
        renewableGeneration: 10,
        essentialConsumption: 4,
        optionalConsumption: 1,
        reserve: 10,
        minimumReserve: 5
      }
    };

    expect(evaluateResourceShelter(base).optionalExpansionAllowed).toBe(false);
    expect(
      evaluateResourceShelter({
        ...base,
        humanApprovalForPhysicalAction: true
      }).optionalExpansionAllowed
    ).toBe(true);
  });
});
