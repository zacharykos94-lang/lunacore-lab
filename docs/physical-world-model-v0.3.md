# LunaCore v0.3 — General Physical World Model

The physical world model represents relationships among entities and reference frames without requiring a particular coordinate system, geometry, body plan, or locomotion mechanism.

## Core ideas

LunaCore may represent:

- entities or regions
- open-ended relation labels such as near, inside, connected, adjacent, blocked, or future relations
- reference frames and parent-frame relationships
- explicitly known transition relationships
- blocked transitions
- uncertainty when a relation or frame is unresolved

Coordinates are optional. A relation can be meaningful even when no Cartesian position is available.

## Reachability

Reachability is inferred only from explicitly represented transition relations marked as allowed.

If an allowed path is represented, LunaCore may report a known path while leaving the physical mechanism unspecified.

If no path is represented, LunaCore reports reachability as unknown rather than treating missing information as proof of impossibility.

A blocked relation records a known obstacle or transition restriction but does not prove that no alternative route exists.

## Reference frames

Entities may belong to named reference frames. Frames may themselves relate to parent frames.

If a frame relationship is missing or unresolved, LunaCore preserves that unknown instead of inventing a transformation.

Future engineering may add metric coordinates, topology, maps, transforms, fluid domains, distributed frames, or other geometry without changing this core rule.

## Physical action

A known world-model path is still not permission to act.

Human authorization, equilibrium, feedback, physical constraints, and output availability remain separate gates.

Likewise, human authorization does not make an unknown path known.

The design rule is:

> Represent relationships before assuming geometry. Treat missing paths as unknown, not impossible. Keep mechanism and authorization separate from spatial knowledge.
