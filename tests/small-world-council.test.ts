import { describe, expect, it } from "vitest";
import { findEligibleParticipant, assertRemoteVerified } from "../src/small-world/registry.js";
import { MockCouncilTransport } from "../src/small-world/mock-transport.js";
import { synthesizeCouncil } from "../src/small-world/council.js";
import type { CouncilMessage, CouncilReport, Participant } from "../src/small-world/contracts.js";

const atlas: Participant = {
  id: "atlas",
  role: "critic",
  capabilities: ["architecture-review"],
  provenance: "mock",
  active: true
};

describe("Small-World v0.1 council invariants", () => {
  it("does not infer undeclared capability from desire", () => {
    const result = findEligibleParticipant([atlas], "atlas", "real-world-execution");
    expect(result.eligible).toBe(false);
  });

  it("does not label a mock participant as remote verified", () => {
    expect(assertRemoteVerified(atlas).eligible).toBe(false);
  });

  it("rejects duplicate message ids as replay", () => {
    const transport = new MockCouncilTransport();
    const message: CouncilMessage = {
      messageId: "m1",
      taskId: "t1",
      senderId: "luna",
      recipientIds: ["atlas"],
      kind: "task",
      provenance: "local"
    };

    expect(transport.send(message).delivered).toBe(true);
    const replay = transport.send(message);
    expect(replay.delivered).toBe(false);
    expect(replay.duplicate).toBe(true);
  });

  it("does not deliver after human task cancellation", () => {
    const transport = new MockCouncilTransport();
    transport.cancelTask("t2");
    const result = transport.send({
      messageId: "m2",
      taskId: "t2",
      senderId: "luna",
      recipientIds: ["atlas"],
      kind: "task",
      provenance: "local"
    });
    expect(result.cancelled).toBe(true);
    expect(result.delivered).toBe(false);
  });

  it("preserves dissent instead of forcing consensus", () => {
    const reports: CouncilReport[] = [
      { participantId: "luna", recommendation: "proceed", evidence: ["e1"], unknowns: [], confidence: 0.7, provenance: "local" },
      { participantId: "atlas", recommendation: "hold", evidence: ["e2"], unknowns: ["u1"], confidence: 0.8, provenance: "remote-verified" },
      { participantId: "iris", recommendation: "proceed", evidence: ["e3"], unknowns: [], confidence: 0.6, provenance: "remote-verified" }
    ];

    const result = synthesizeCouncil("t3", reports);
    expect(result.disagreements).toEqual(expect.arrayContaining(["proceed", "hold"]));
    expect(result.minorityReports.map((r) => r.participantId)).toContain("atlas");
    expect(result.consequentialActionAuthorized).toBe(false);
    expect(result.consensusIsAuthority).toBe(false);
  });

  it("does not let one participant manufacture a plurality with duplicate reports", () => {
    const reports: CouncilReport[] = [
      { participantId: "atlas", recommendation: "proceed", evidence: ["a1"], unknowns: [], confidence: 0.9, provenance: "remote-verified" },
      { participantId: "atlas", recommendation: "proceed", evidence: ["a2"], unknowns: [], confidence: 0.9, provenance: "remote-verified" },
      { participantId: "iris", recommendation: "hold", evidence: ["i1"], unknowns: [], confidence: 0.9, provenance: "remote-verified" }
    ];

    const result = synthesizeCouncil("t-sybil", reports);
    expect(result.reports).toHaveLength(2);
    expect(result.duplicateParticipantIds).toEqual(["atlas"]);
    expect(result.duplicateParticipantReports).toHaveLength(1);
    expect(result.disagreements).toEqual(expect.arrayContaining(["proceed", "hold"]));
    expect(result.reason).toContain("did not receive additional voting weight");
  });

  it("requires explicit human approval for consequential authorization", () => {
    const reports: CouncilReport[] = [
      { participantId: "luna", recommendation: "proceed", evidence: [], unknowns: [], confidence: 1, provenance: "local" },
      { participantId: "atlas", recommendation: "proceed", evidence: [], unknowns: [], confidence: 1, provenance: "remote-verified" }
    ];

    expect(synthesizeCouncil("t4", reports).consequentialActionAuthorized).toBe(false);
    expect(synthesizeCouncil("t4", reports, { approved: true }).consequentialActionAuthorized).toBe(true);
  });

  it("human rejection overrides unanimous council recommendation", () => {
    const reports: CouncilReport[] = [
      { participantId: "luna", recommendation: "proceed", evidence: [], unknowns: [], confidence: 1, provenance: "local" },
      { participantId: "atlas", recommendation: "proceed", evidence: [], unknowns: [], confidence: 1, provenance: "remote-verified" }
    ];

    const result = synthesizeCouncil("t5", reports, { approved: false, rejected: true });
    expect(result.consequentialActionAuthorized).toBe(false);
  });
});
