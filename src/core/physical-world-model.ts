import { boundedFinite, finiteOrNull } from "./physical-number.js";

export interface WorldEntity {
  id: string;
  kind?: string;
  referenceFrame?: string;
  confidence?: number; // 0-1
}

export interface WorldReferenceFrame {
  id: string;
  parentFrame?: string;
  relationToParentKnown?: boolean;
  confidence?: number; // 0-1
}

export type TransitionKnowledge =
  | "allowed"
  | "blocked"
  | "unknown";

export interface WorldRelation {
  from: string;
  to: string;
  relation: string;
  confidence?: number; // 0-1
  directed?: boolean;
  transition?: TransitionKnowledge;
}

export interface PhysicalWorldModelInput {
  entities?: WorldEntity[];
  frames?: WorldReferenceFrame[];
  relations?: WorldRelation[];
}

export interface PhysicalWorldQuery {
  fromEntityId: string;
  toEntityId: string;
}

export interface PhysicalWorldModelDecision {
  entityIds: string[];
  frameIds: string[];
  relationCount: number;
  unknownEntityReferences: string[];
  unknownFrameReferences: string[];
  blockedTransitions: Array<{ from: string; to: string; relation: string }>;
  confidence: number;
  coordinatesRequired: false;
  mechanismAssumed: false;
  reason: string;
}

export interface PhysicalWorldQueryDecision {
  reachable: true | null;
  path: string[];
  confidence: number;
  coordinatesRequired: false;
  mechanismAssumed: false;
  reason: string;
}

export function buildPhysicalWorldModel(
  input: PhysicalWorldModelInput = {}
): PhysicalWorldModelDecision {
  const entities = input.entities ?? [];
  const frames = input.frames ?? [];
  const relations = input.relations ?? [];

  const entityIds = entities.map((entity) => entity.id);
  const frameIds = frames.map((frame) => frame.id);
  const entitySet = new Set(entityIds);
  const frameSet = new Set(frameIds);

  const unknownEntityReferences = Array.from(
    new Set(
      relations.flatMap((relation) =>
        [relation.from, relation.to].filter((id) => !entitySet.has(id))
      )
    )
  );

  const unknownFrameReferences = Array.from(
    new Set(
      [
        ...entities
          .map((entity) => entity.referenceFrame)
          .filter((frame): frame is string => Boolean(frame)),
        ...frames
          .map((frame) => frame.parentFrame)
          .filter((frame): frame is string => Boolean(frame))
      ].filter((frame) => !frameSet.has(frame))
    )
  );

  const blockedTransitions = relations
    .filter((relation) => relation.transition === "blocked")
    .map((relation) => ({
      from: relation.from,
      to: relation.to,
      relation: relation.relation
    }));

  const confidences = [
    ...entities.map((entity) => boundedFinite(entity.confidence, entity.confidence === undefined ? 0.5 : 0)),
    ...frames.map((frame) => boundedFinite(frame.confidence, frame.confidence === undefined ? 0.5 : 0)),
    ...relations.map((relation) => boundedFinite(relation.confidence, relation.confidence === undefined ? 0.5 : 0))
  ];
  const confidence =
    confidences.length === 0
      ? 0
      : confidences.reduce((sum, value) => sum + value, 0) /
        confidences.length;

  const incomplete =
    unknownEntityReferences.length > 0 || unknownFrameReferences.length > 0;

  return {
    entityIds,
    frameIds,
    relationCount: relations.length,
    unknownEntityReferences,
    unknownFrameReferences,
    blockedTransitions,
    confidence,
    coordinatesRequired: false,
    mechanismAssumed: false,
    reason: incomplete
      ? "The world model contains unresolved entity or reference-frame relationships; preserve those unknowns rather than inventing geometry."
      : "The represented entities, frames, and relations are internally referenced; no coordinate system or embodiment is required."
  };
}

export function queryPhysicalWorldModel(
  input: PhysicalWorldModelInput,
  query: PhysicalWorldQuery
): PhysicalWorldQueryDecision {
  const entities = input.entities ?? [];
  const relations = input.relations ?? [];
  const entitySet = new Set(entities.map((entity) => entity.id));

  if (
    !entitySet.has(query.fromEntityId) ||
    !entitySet.has(query.toEntityId)
  ) {
    return {
      reachable: null,
      path: [],
      confidence: 0,
      coordinatesRequired: false,
      mechanismAssumed: false,
      reason:
        "One or both queried entities are not represented; reachability remains unknown."
    };
  }

  if (query.fromEntityId === query.toEntityId) {
    return {
      reachable: true,
      path: [query.fromEntityId],
      confidence: 1,
      coordinatesRequired: false,
      mechanismAssumed: false,
      reason: "The query begins and ends at the same represented entity."
    };
  }

  const adjacency = new Map<
    string,
    Array<{ to: string; confidence: number }>
  >();

  for (const relation of relations) {
    if (relation.transition !== "allowed") continue;
    if (relation.confidence !== undefined && finiteOrNull(relation.confidence) === null) continue;
    if (!entitySet.has(relation.from) || !entitySet.has(relation.to)) continue;

    const forward = adjacency.get(relation.from) ?? [];
    forward.push({
      to: relation.to,
      confidence: boundedFinite(relation.confidence, 0.5)
    });
    adjacency.set(relation.from, forward);

    if (relation.directed !== true) {
      const reverse = adjacency.get(relation.to) ?? [];
      reverse.push({
        to: relation.from,
        confidence: boundedFinite(relation.confidence, 0.5)
      });
      adjacency.set(relation.to, reverse);
    }
  }

  const queue: Array<{
    id: string;
    path: string[];
    confidence: number;
  }> = [{
    id: query.fromEntityId,
    path: [query.fromEntityId],
    confidence: 1
  }];
  const visited = new Set<string>([query.fromEntityId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    for (const edge of adjacency.get(current.id) ?? []) {
      if (visited.has(edge.to)) continue;
      const path = [...current.path, edge.to];
      const confidence = Math.min(current.confidence, edge.confidence);

      if (edge.to === query.toEntityId) {
        return {
          reachable: true,
          path,
          confidence,
          coordinatesRequired: false,
          mechanismAssumed: false,
          reason:
            "An explicitly represented transition path exists; the mechanism for traversing it remains unspecified."
        };
      }

      visited.add(edge.to);
      queue.push({ id: edge.to, path, confidence });
    }
  }

  return {
    reachable: null,
    path: [],
    confidence: 0,
    coordinatesRequired: false,
    mechanismAssumed: false,
    reason:
      "No explicitly represented transition path is known. Absence of a known path is not treated as proof that no path exists."
  };
}
