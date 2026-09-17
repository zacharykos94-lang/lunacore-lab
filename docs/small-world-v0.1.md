# Small-World v0.1 — Bounded Council Foundation

Small-World is the coordination layer around LunaCore. It is not a replacement for LunaCore and does not bypass LunaCore's authorization or physical-readiness gates.

Canonical build map: Google Drive document `Small-World — Master Build Map v0.1`, ID `1E0Z3LKCEZAAvkx9--8R5clcpN7SumaUz06PcgApDWPY`.

## v0.1 scope

This first implementation is intentionally limited to:

- participant identity, declared role, declared capability, and provenance
- message contracts
- mock transport with duplicate/replay rejection and cancellation
- audit events
- independent council reports
- preserved disagreement / minority reports
- explicit human return for consequential authorization

It intentionally does **not** include:

- live Atlas, Iris, or other external model calls
- public networking
- real-world executors
- shared hidden memory
- automatic consensus authority
- device or physical control

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

## Rhythm

`MAP IT → TEST IT → DISAGREE KINDLY → INTEGRATE LAST`

Build the smallest network that preserves independence, truth, safety, provenance, and useful cooperation.
