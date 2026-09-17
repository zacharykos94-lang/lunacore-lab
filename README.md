# LunaCore Lab

LunaCore is an experimental TypeScript decision-support core centered on human agency, bounded learning, transparent provenance, adaptive support, resource stewardship, and explicit authorization boundaries.

## v0.2 foundation

The completed v0.2 branch established:

- active support calibrated by likelihood, severity, reversibility, and uncertainty
- context and stated-purpose weighting
- presence, leisure, creative exploration, and strategic stillness
- renewable-energy generation/consumption and reserve stewardship
- secure-shelter-first resilience logic
- bounded outcome learning that cannot turn history into identity
- structured decision provenance without exposing private chain-of-thought
- centralized human authorization for external or high-impact actions
- integrated `runLunaCore` orchestration
- GitHub Actions CI for tests and strict TypeScript checks

## v0.3 experimental physical foundation

Branch: `lunacore-v0.3-physical-interface`

v0.3 adds a deliberately mechanism-agnostic interface to the physical world. It does **not** assume a robot body, wheels, limbs, rigid structure, air, water, or any particular actuator or sensor package.

Current physical-foundation capabilities include:

- extensible sensory input channels, including visual input without privileging vision
- extensible output channels, including visual output
- open environment medium and reference-frame representation
- equilibrium / stability representation
- multi-sensor state estimation that preserves disagreement
- general world relationships and transition paths without requiring coordinates
- change-rate and freshness tracking without automatic future extrapolation
- abstract capability awareness without inventing an embodiment
- degraded/fault operation without silently bypassing failed required subsystems
- desired-state regions and bounded feedback: observe, hold, stabilize, adjust
- hard/soft physical constraint envelopes supplied by the domain
- renewable-energy / reserve gating for physical action
- abstract physical output intent without device-specific commands
- centralized human authorization for real-world effects
- a final physical-readiness summary that cannot create new authority

A medium such as `water` is simply represented as a medium. No water-specific mechanism is built into the reasoning core, leaving future engineering free to use flow, buoyancy, pressure, deformation, fields, distributed actuation, or approaches not yet anticipated.

## Core principles

A good system should know when to act, when to create, when to enjoy, and when to remain still.

Reasoning, recommendation, capability, physical readiness, and authorization are separate. A recommendation never grants permission, and permission never proves that the physical world is traversable, adequately powered, or mechanically capable.

## Physical loop

The current v0.3 physical loop is intentionally general:

```text
External World
→ Sensory Channels
→ Multi-Sensor State Estimate
→ World / Reference-Frame Model
→ Change & Freshness
→ Equilibrium / Stability
→ Capability & Subsystem Health
→ Desired State Region
→ Bounded Feedback
→ Known Physical Constraints
→ Energy / Shelter Stewardship
→ Human Authorization
→ Abstract Output Intent
→ Physical Readiness Summary
→ External World
→ Re-sense
```

The core rule is:

> Sense generally. Preserve disagreement. Represent state honestly. Preserve equilibrium. Track freshness. Know capability. Respect known constraints. Protect shelter and energy reserves. Authorize before affecting the world. Express intent without assuming mechanism. Re-observe.

## Run locally or in Codespaces

```bash
npm install
npm test
npm run check
npm start
```

## Architecture documents

- `docs/architecture-v0.2.md` — adaptive support, context, purpose, learning, provenance, authorization, resources
- `docs/architecture-v0.3.md` — general physical-interface foundation
- `docs/physical-world-model-v0.3.md` — relationships, reference frames, and reachability
- `docs/physical-change-v0.3.md` — physical change and freshness
- `docs/physical-capabilities-v0.3.md` — abstract capability awareness
- `docs/physical-resilience-v0.3.md` — degraded operation and recovery boundary
- `docs/physical-energy-v0.3.md` — physical demand and renewable/resource stewardship
- `docs/physical-readiness-v0.3.md` — final physical-gate summary
- `docs/v0.3-physical-foundation-checkpoint.md` — stable invariants, intentional non-goals, and promotion/change criteria

## Development policy

New behavior should preserve human agency, uncertainty, reversibility, provenance, secure resource priorities, and explicit approval for high-impact actions. Physical-domain limits should be supplied by the relevant domain rather than invented by LunaCore. Tests and `npm run check` must pass before experimental physical work is promoted.
