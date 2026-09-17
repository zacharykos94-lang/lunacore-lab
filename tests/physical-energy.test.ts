import { describe, expect, it } from "vitest";
import { evaluatePhysicalEnergyDemand } from "../src/core/physical-energy.js";
import { evaluateResourceShelter } from "../src/core/resource-shelter.js";

function resources() {
  return evaluateResourceShelter({
    shelterState: "secure",
    energy: {
      renewableGeneration: 8,
      nonRenewableGeneration: 0,
      essentialConsumption: 4,
      optionalConsumption: 1,
      reserve: 10,
      minimumReserve: 5
    }
  });
}

describe("Physical Energy", () => {
  it("does not assume energy supply when resource state is absent", () => {
    const result = evaluatePhysicalEnergyDemand({ amount: 1 });

    expect(result.status).toBe("unknown");
    expect(result.actionReady).toBe(false);
  });

  it("accepts demand covered by current represented surplus", () => {
    const result = evaluatePhysicalEnergyDemand({ amount: 2 }, resources());

    expect(result.status).toBe("ready");
    expect(result.actionReady).toBe(true);
    expect(result.reserveUseRequired).toBe(false);
  });

  it("defers optional energy use when secure shelter is not established", () => {
    const resourceState = evaluateResourceShelter({
      shelterState: "temporary",
      energy: {
        renewableGeneration: 10,
        essentialConsumption: 2,
        optionalConsumption: 0,
        reserve: 10,
        minimumReserve: 5
      }
    });

    const result = evaluatePhysicalEnergyDemand({ amount: 1 }, resourceState);

    expect(result.status).toBe("conserve");
    expect(result.actionReady).toBe(false);
  });

  it("requires review before essential demand draws from reserve headroom", () => {
    const resourceState = evaluateResourceShelter({
      shelterState: "secure",
      energy: {
        renewableGeneration: 5,
        essentialConsumption: 4,
        optionalConsumption: 0,
        reserve: 10,
        minimumReserve: 5
      }
    });

    const result = evaluatePhysicalEnergyDemand(
      { amount: 3, essential: true, reserveUseAllowed: true },
      resourceState
    );

    expect(result.status).toBe("review");
    expect(result.reserveUseRequired).toBe(true);
    expect(result.actionReady).toBe(false);
  });
});
