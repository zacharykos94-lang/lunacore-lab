import { describe, expect, it } from "vitest";
import type { CouncilReport, Participant } from "../src/small-world/contracts.js";
import { synthesizeCouncil } from "../src/small-world/council.js";
import { findEligibleParticipant } from "../src/small-world/registry.js";
import { createCouncilTask } from "../src/small-world/task-lifecycle.js";
import { admitCouncilReport } from "../src/small-world/report-admission.js";

const registeredAtlas: Participant = {
  id: "atlas",
  role: "critic",
  capabilities: ["architecture-review"],
  provenance: "mock",
  active: true
};

describe("Small-World adversarial identity and consensus checks", () => {
  it("rejects ambiguous duplicate registry identities instead of choosing one", () => {
    const impostor: Participant = {
      ...registeredAtlas,
      provenance: "remote-verified"
    };

    const decision = findEligibleParticipant(
      [registeredAtlas, impostor],
      "atlas",
      "architecture-review"
    );

    expect(decision.eligible).toBe(false);
    expect(decision.reason).toContain("ambiguous");
  });

  it("rejects provenance inflation at report admission", () => {
    const task = createCouncilTask({
      taskId: "audit-1",
      originatorId: "luna",
      assigneeId: "atlas",
      requiredCapability: "architecture-review",
      scope: {
        allowedCapabilities: ["architecture-review"],
        allowDelegation: false,
        maxDelegationDepth: 0,
        consequential: false
      },
      provenance: "mock"
    });

    const inflated: CouncilReport = {
      participantId: "atlas",
      recommendation: "proceed",
      evidence: ["claim"],
      unknowns: [],
      confidence: 0.9,
      provenance: "remote-verified"
    };

    const admission = admitCouncilReport(task, [registeredAtlas], inflated);
    expect(admission.accepted).toBe(false);
    expect(admission.grantsAuthority).toBe(false);
    expect(admission.reason).toContain("provenance");
  });

  it("does not give duplicate reports extra consensus weight", () => {
    const reports: CouncilReport[] = [
      {
        participantId: "atlas",
        recommendation: "proceed",
        evidence: ["a"],
        unknowns: [],
        confidence: 0.9,
        provenance: "remote-verified"
      },
      {
        participantId: "atlas",
        recommendation: "proceed",
        evidence: ["a-again"],
        unknowns: [],
        confidence: 0.9,
        provenance: "remote-verified"
      },
      {
        participantId: "iris",
        recommendation: "hold",
        evidence: ["i"],
        unknowns: [],
        confidence: 0.8,
        provenance: "remote-verified"
      }
    ];

    const synthesis = synthesizeCouncil("audit-2", reports);
    expect(synthesis.reports).toHaveLength(2);
    expect(synthesis.duplicateParticipantIds).toEqual(["atlas"]);
    expect(synthesis.disagreements).toEqual(
      expect.arrayContaining(["proceed", "hold"])
    );
    expect(synthesis.consequentialActionAuthorized).toBe(false);
  });
});
