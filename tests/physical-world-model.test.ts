import { describe, expect, it } from "vitest";
import {
  buildPhysicalWorldModel,
  queryPhysicalWorldModel
} from "../src/core/physical-world-model.js";

describe("Physical World Model", () => {
  it("represents relations without requiring coordinates", () => {
    const result = buildPhysicalWorldModel({
      entities: [
        { id: "a", referenceFrame: "local" },
        { id: "b", referenceFrame: "local" }
      ],
      frames: [{ id: "local" }],
      relations: [
        {
          from: "a",
          to: "b",
          relation: "near",
          transition: "allowed",
          confidence: 0.9
        }
      ]
    });

    expect(result.coordinatesRequired).toBe(false);
    expect(result.mechanismAssumed).toBe(false);
    expect(result.unknownEntityReferences).toHaveLength(0);
    expect(result.unknownFrameReferences).toHaveLength(0);
  });

  it("preserves unresolved frame references", () => {
    const result = buildPhysicalWorldModel({
      entities: [{ id: "a", referenceFrame: "unseen-frame" }]
    });

    expect(result.unknownFrameReferences).toContain("unseen-frame");
  });

  it("finds explicitly represented transition paths without selecting a mechanism", () => {
    const input = {
      entities: [{ id: "a" }, { id: "b" }, { id: "c" }],
      relations: [
        {
          from: "a",
          to: "b",
          relation: "connected",
          transition: "allowed" as const,
          confidence: 0.8
        },
        {
          from: "b",
          to: "c",
          relation: "connected",
          transition: "allowed" as const,
          confidence: 0.7
        }
      ]
    };

    const result = queryPhysicalWorldModel(input, {
      fromEntityId: "a",
      toEntityId: "c"
    });

    expect(result.reachable).toBe(true);
    expect(result.path).toEqual(["a", "b", "c"]);
    expect(result.confidence).toBe(0.7);
    expect(result.coordinatesRequired).toBe(false);
    expect(result.mechanismAssumed).toBe(false);
  });

  it("treats no known path as unknown rather than impossible", () => {
    const result = queryPhysicalWorldModel(
      {
        entities: [{ id: "a" }, { id: "b" }],
        relations: [
          {
            from: "a",
            to: "b",
            relation: "blocked",
            transition: "blocked"
          }
        ]
      },
      { fromEntityId: "a", toEntityId: "b" }
    );

    expect(result.reachable).toBe(null);
    expect(result.path).toHaveLength(0);
  });
});
