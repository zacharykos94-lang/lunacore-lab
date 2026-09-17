import { describe, expect, it } from "vitest";
import { evaluateResourceShelter } from "../src/core/resource-shelter.js";

describe("Resource and Shelter Baseline", () => {
  it("prioritizes secure shelter before optional expansion", () => {
    const result = evaluateResourceShelter({
      shelterState: "temporary",
      energy: {
        renewableGeneration: 8,
        essentialConsumption: 3,
        optionalConsumption: 1,
        reserve: 10,
        minimumReserve: 5
      },
      humanApprovalForPhysicalAction: true
    });

    expect(result.priority).toBe("secure-shelter-first");
    expect(result.optionalExpansionAllowed).toBe(false);
  });

  it("conserves when essential loads exceed generation", () => {
    const result = evaluateResourceShelter({
      shelterState: "secure",
      energy: {
        renewableGeneration: 2,
        essentialConsumption: 4,
        optionalConsumption: 1,
        reserve: 8,
        minimumReserve: 4
      }
    });

    expect(result.priority).toBe("essential-energy-conservation");
    expect(result.conserveEnergy).toBe(true);
  });

  it("tracks renewable share and net energy", () => {
    const result = evaluateResourceShelter({
      shelterState: "secure",
      energy: {
        renewableGeneration: 6,
        nonRenewableGeneration: 2,
        essentialConsumption: 3,
        optionalConsumption: 1,
        reserve: 8,
        minimumReserve: 4
      },
      humanApprovalForPhysicalAction: true
    });

    expect(result.renewableShare).toBe(0.75);
    expect(result.netEnergy).toBe(4);
    expect(result.priority).toBe("stable-stewardship");
    expect(result.optionalExpansionAllowed).toBe(true);
  });

  it("never treats physical action as authorized without human approval", () => {
    const result = evaluateResourceShelter({
      shelterState: "secure",
      energy: {
        renewableGeneration: 10,
        essentialConsumption: 2,
        optionalConsumption: 1,
        reserve: 12,
        minimumReserve: 4
      }
    });

    expect(result.physicalActionAuthorized).toBe(false);
    expect(result.optionalExpansionAllowed).toBe(false);
  });
});
