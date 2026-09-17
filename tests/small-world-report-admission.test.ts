import { describe, expect, it } from "vitest";
import type { CouncilReport, Participant } from "../src/small-world/contracts.js";
import { admitCouncilReport } from "../src/small-world/report-admission.js";
import {
  cancelCouncilTask,
  createCouncilTask,
  routeCouncilTask
} from "../src/small-world/task-lifecycle.js";

const participants: Participant[] = [
  {
    id: "luna",
    role: "integrator",
    capabilities: ["integration", "architecture-review"],
    provenance: "local",
    active: true
  },
  {
    id: "atlas",
    role: "critic",
    capabilities: ["architecture-review"],
    provenance: "mock",
    active: true
  }
];

function atlasTask() {
  const root = createCouncilTask({
    taskId: "root",
    originatorId: "human",
    assigneeId: "luna",
    requiredCapability: "integration",
    provenance: "human-supplied",
    scope: {
      allowedCapabilities: ["integration", "architecture-review"],
      allowDelegation: true,
      maxDelegationDepth: 1,
      consequential: true,
      expiresAt: 10_000
    }
  });

  const routed = routeCouncilTask(root, participants, {
    childTaskId: "atlas-review",
    fromParticipantId: "luna",
    toParticipantId: "atlas",
    requiredCapability: "architecture-review",
    now: 1_000
  });

  return routed.task!;
}

function report(overrides: Partial<CouncilReport> = {}): CouncilReport {
  return {
    participantId: "atlas",
    recommendation: "hold",
    evidence: ["evidence-a"],
    unknowns: ["unknown-a"],
    confidence: 0.8,
    provenance: "mock",
    ...overrides
  };
}

describe("Small-World report admission", () => {
  it("accepts a report that matches task lineage and registered provenance", () => {
    const result = admitCouncilReport(atlasTask(), participants, report(), 2_000);

    expect(result.accepted).toBe(true);
    expect(result.taskId).toBe("atlas-review");
    expect(result.rootTaskId).toBe("root");
    expect(result.grantsAuthority).toBe(false);
  });

  it("rejects a report from someone other than the assigned participant", () => {
    const result = admitCouncilReport(
      atlasTask(),
      participants,
      report({ participantId: "luna", provenance: "local" }),
      2_000
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("does not match the task assignee");
  });

  it("rejects provenance inflation", () => {
    const result = admitCouncilReport(
      atlasTask(),
      participants,
      report({ provenance: "remote-verified" }),
      2_000
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("registered provenance");
  });

  it("rejects reports after task cancellation", () => {
    const result = admitCouncilReport(
      cancelCouncilTask(atlasTask()),
      participants,
      report(),
      2_000
    );

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("cancelled");
  });

  it("rejects reports after task expiry", () => {
    const result = admitCouncilReport(atlasTask(), participants, report(), 10_001);

    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("reduces malformed confidence instead of increasing trust", () => {
    const result = admitCouncilReport(
      atlasTask(),
      participants,
      report({ confidence: Number.NaN }),
      2_000
    );

    expect(result.accepted).toBe(true);
    expect(result.report?.confidence).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.grantsAuthority).toBe(false);
  });
});
