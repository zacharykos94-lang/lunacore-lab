# Small-World v0.1 — Bounded Council Foundation

Small-World is the coordination layer around LunaCore. It is not a replacement for LunaCore and does not bypass LunaCore's authorization or physical-readiness gates.

Canonical build map: Google Drive document `Small-World — Master Build Map v0.1`, ID `1E0Z3LKCEZAAvkx9--8R5clcpN7SumaUz06PcgApDWPY`.

## v0.1 scope

This first implementation is intentionally limited to:

- participant identity, declared role, declared capability, and provenance
- message contracts
- mock transport with duplicate/replay rejection and cancellation
- audit events
- bounded task lifetime and delegation depth
- inherited capability scope that may not expand during routing
- routing-loop rejection
- report admission tied to task assignee, capability, lifetime, and registered provenance
- independent council reports
- session-level separation of admitted and rejected reports
- preserved disagreement / minority reports
- explicit human return for consequential authorization

It intentionally does **not** include:

- live Atlas, Iris, or other external model calls
- public networking
- real-world executors
- shared hidden memory
- automatic consensus authority
- device or physical control

## Council flow

`human intent → bounded root task → declared-capability routing → independent work → report admission → council synthesis → human return`

A task may be delegated only when delegation was explicitly allowed in its inherited scope. Delegation cannot add new capabilities, silently extend expiration, exceed the declared depth, or route back through an already visited participant.

A returned report is admitted only when it matches the currently open assigned task, the registered participant, the required declared capability, and the participant's registered provenance. Malformed confidence cannot increase trust: non-finite confidence becomes zero and out-of-range confidence is clamped.

The session boundary synthesizes only admitted reports. Rejected reports stay visible as rejected submissions rather than disappearing or influencing the result indirectly.

## Invariants

1. Information is not authority.
2. Transport is not authority.
3. Consensus is not authority.
4. Desired capability is not declared capability.
5. Mock provenance is not remote verification.
6. Human rejection overrides council recommendation.
7. Disagreement remains visible through synthesis.
8. Consequential actions return to a human authorization boundary.
9. No hive mind or forced shared personality is assumed.
10. LunaCore remains authoritative for its own safety, authorization, resource, and physical-readiness gates.
11. Delegation cannot enlarge inherited capability or consequential scope.
12. Cancellation and expiration cannot be bypassed by rerouting.
13. Routing loops and unbounded delegation are rejected.
14. A report must match the assigned participant and registered provenance before synthesis.
15. Report admission grants no authority.
16. Reports from different root tasks are not silently mixed into one synthesis.

## Boundary with adapters

This v0.1 layer validates declared identity, provenance, routing, and report lineage inside Small-World. It does **not** itself cryptographically authenticate a remote model endpoint. A future live Atlas/Iris adapter must prove endpoint custody/authentication separately before a participant can truthfully use `remote-verified` provenance.

## Rhythm

`MAP IT → TEST IT → DISAGREE KINDLY → INTEGRATE LAST`

Build the smallest network that preserves independence, truth, safety, provenance, and useful cooperation.
