import { describe, expect, it } from "vitest";
import type { Participant } from "../src/small-world/contracts.js";
import {
  cancelCouncilTask,
  createCouncilTask,
  evaluateCouncilTask,
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
    provenance: "remote-verified",
    active: true
  },
  {
    id: "iris",
    role: "synthesizer",
    capabilities: ["synthesis"],
    provenance: "remote-verified",
    active: true
  }
];

function rootTask() {
  return createCouncilTask({
    taskId: "root",
    originatorId: "human",
    assigneeId: "luna",
    requiredCapability: "integration",
    provenance: "human-supplied",
    scope: {
      allowedCapabilities: ["integration", "architecture-review"],
      allowDelegation: true,
      maxDelegationDepth: 2,
      consequential: true,
      expiresAt: 10_000
    }
  });
}

describe("Small-World task lifecycle", () => {
  it("routes only inside inherited capability scope", () => {
    const result = routeCouncilTask(rootTask(), participants, {
      childTaskId: "child-1",
      fromParticipantId: "luna",
      toParticipantId: "atlas",
      requiredCapability: "architecture-review",
      now: 1_000
    });

    expect(result.allowed).toBe(true);
    expect(result.authorityExpanded).toBe(false);
    expect(result.task?.rootTaskId).toBe("root");
    expect(result.task?.parentTaskId).toBe("root");
    expect(result.task?.scope.consequential).toBe(true);
    expect(result.task?.scope.allowedCapabilities).toEqual([
      "integration",
      "architecture-review"
    ]);
  });

  it("rejects capability inflation during routing", () => {
    const result = routeCouncilTask(rootTask(), participants, {
      childTaskId: "child-2",
      fromParticipantId: "luna",
      toParticipantId: "iris",
      requiredCapability: "synthesis",
      now: 1_000
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("outside the inherited task scope");
  });

  it("does not route cancelled work", () => {
    const result = routeCouncilTask(cancelCouncilTask(rootTask()), participants, {
      childTaskId: "child-3",
      fromParticipantId: "luna",
      toParticipantId: "atlas",
      requiredCapability: "architecture-review",
      now: 1_000
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cancelled");
  });

  it("expires work instead of silently extending its lifetime", () => {
    expect(evaluateCouncilTask(rootTask(), 10_000).status).toBe("expired");

    const result = routeCouncilTask(rootTask(), participants, {
      childTaskId: "child-4",
      fromParticipantId: "luna",
      toParticipantId: "atlas",
      requiredCapability: "architecture-review",
      now: 10_001
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("fails closed on malformed expiry and delegation depth", () => {
    const malformed = createCouncilTask({
      taskId: "bad",
      originatorId: "human",
      assigneeId: "luna",
      requiredCapability: "integration",
      provenance: "human-supplied",
      scope: {
        allowedCapabilities: ["integration", "architecture-review"],
        allowDelegation: true,
        maxDelegationDepth: Number.POSITIVE_INFINITY,
        consequential: false,
        expiresAt: Number.NaN
      }
    });

    expect(evaluateCouncilTask(malformed, 1).status).toBe("expired");

    const noDepth = createCouncilTask({
      taskId: "depth",
      originatorId: "human",
      assigneeId: "luna",
      requiredCapability: "integration",
      provenance: "human-supplied",
      scope: {
        allowedCapabilities: ["integration", "architecture-review"],
        allowDelegation: true,
        maxDelegationDepth: Number.NaN,
        consequential: false
      }
    });

    expect(
      routeCouncilTask(noDepth, participants, {
        childTaskId: "never",
        fromParticipantId: "luna",
        toParticipantId: "atlas",
        requiredCapability: "architecture-review",
        now: 1
      }).allowed
    ).toBe(false);
  });

  it("blocks delegation loops", () => {
    const first = routeCouncilTask(rootTask(), participants, {
      childTaskId: "child-5",
      fromParticipantId: "luna",
      toParticipantId: "atlas",
      requiredCapability: "architecture-review",
      now: 1_000
    });

    expect(first.allowed).toBe(true);

    const loop = routeCouncilTask(first.task!, participants, {
      childTaskId: "child-6",
      fromParticipantId: "atlas",
      toParticipantId: "luna",
      requiredCapability: "integration",
      now: 1_001
    });

    expect(loop.allowed).toBe(false);
    expect(loop.reason).toContain("prevent loops");
  });

  it("blocks routing by anyone other than the current assignee", () => {
    const result = routeCouncilTask(rootTask(), participants, {
      childTaskId: "child-7",
      fromParticipantId: "atlas",
      toParticipantId: "iris",
      requiredCapability: "architecture-review",
      now: 1_000
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("current assignee");
  });
});
