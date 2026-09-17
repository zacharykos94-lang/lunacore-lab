import { describe, expect, it } from "vitest";
import type { CouncilReport, Participant } from "../src/small-world/contracts.js";
import { runCouncilSession } from "../src/small-world/session.js";
import {
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

function root(rootId = "root") {
  return createCouncilTask({
    taskId: rootId,
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
}

function atlasTask(rootId = "root") {
  const routed = routeCouncilTask(root(rootId), participants, {
    childTaskId: `${rootId}-atlas`,
    fromParticipantId: "luna",
    toParticipantId: "atlas",
    requiredCapability: "architecture-review",
    now: 1_000
  });
  return routed.task!;
}

function atlasReport(overrides: Partial<CouncilReport> = {}): CouncilReport {
  return {
    participantId: "atlas",
    recommendation: "hold",
    evidence: ["e1"],
    unknowns: [],
    confidence: 0.8,
    provenance: "mock",
    ...overrides
  };
}

describe("Small-World council session boundary", () => {
  it("synthesizes admitted reports and keeps rejected reports out", () => {
    const task = atlasTask();
    const result = runCouncilSession(
      "root",
      [
        { task, report: atlasReport() },
        {
          task,
          report: atlasReport({ provenance: "remote-verified", recommendation: "proceed" })
        }
      ],
      participants,
      undefined,
      2_000
    );

    expect(result.admitted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.synthesis.reports).toHaveLength(1);
    expect(result.synthesis.reports[0]?.recommendation).toBe("hold");
    expect(result.rawReportsBypassedAdmission).toBe(false);
  });

  it("does not mix reports from different root tasks", () => {
    const result = runCouncilSession(
      "root-a",
      [{ task: atlasTask("root-b"), report: atlasReport() }],
      participants,
      undefined,
      2_000
    );

    expect(result.admitted).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.reason).toContain("different root task");
  });

  it("does not convert human approval into council authorization when no report was admitted", () => {
    const forgedTask = atlasTask();
    const result = runCouncilSession(
      "root",
      [
        {
          task: forgedTask,
          report: atlasReport({ provenance: "remote-verified" })
        }
      ],
      participants,
      { approved: true },
      2_000
    );

    expect(result.admitted).toHaveLength(0);
    expect(result.synthesis.consequentialActionAuthorized).toBe(false);
  });
});
