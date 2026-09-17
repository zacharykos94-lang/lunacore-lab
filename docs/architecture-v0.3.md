# LunaCore v0.3 — General Physical Interface

LunaCore v0.3 begins an intentionally mechanism-agnostic interface to the physical world.

The purpose of this layer is not to decide what body, robot, vehicle, fluid system, display, sensor package, or other embodiment LunaCore must use. It defines only the minimum concepts needed for future physical sensing and action while preserving room for technologies and media that do not yet exist.

## General Flow

External World
→ Sensory Channels
→ Physical State / Environment
→ Equilibrium / Stability
→ LunaCore Reasoning
→ Human Authorization
→ Output / Physical Interaction
→ New Sensory Input

## Sensory Input

Sensory input is represented as extensible named channels rather than a fixed list of human senses.

Examples may include visual, acoustic, pressure, temperature, chemical, field, position, contact, flow, or future sensing methods. These are examples only.

Visual input is therefore supported without making vision mandatory or privileged.

## Output

Output uses the same open-channel principle.

An output channel may eventually represent visual signaling, sound, motion, force, flow, light, display, deformation, or another interaction mechanism. LunaCore does not assume that output requires limbs, wheels, motors, rigid structures, or any other specific implementation.

Visual output is supported as one possible output channel.

## Environment and Medium

The physical environment may optionally identify a medium and reference frame.

The medium is intentionally an open string rather than a closed enumeration. It could describe air, water, ground contact, a mixed environment, an engineered medium, or something not anticipated by the current design.

No medium implies a required locomotion or interaction mechanism.

## Equilibrium and Stability

Physical interaction should account for equilibrium or stability before optional movement.

The current abstraction represents stability as a bounded estimate when one is available. If equilibrium is unknown, LunaCore should prefer observation rather than inventing certainty. If stability is poor, stabilizing takes priority over optional movement or interaction.

This is intentionally general: equilibrium may later mean balance, buoyancy, pressure equilibrium, attitude control, dynamic stability, structural stability, flow stability, or another domain-specific condition.

## Movement

Movement is represented as intent to change physical state or position relative to an environment.

The core does not specify how that movement occurs.

Future implementations might use rigid-body locomotion, wheels, legs, propulsion, buoyancy, fluid flow, deformation, distributed actuation, manipulation of an available medium, or mechanisms not currently anticipated.

The architecture should therefore ask **what state change is intended and what constraints apply**, not assume a particular body plan.

## Physical Interaction and Human Agency

A physical recommendation is not authorization to act.

Physical interaction is routed through LunaCore's human authorization layer. Reversible, bounded physical actions may later operate under explicit scoped and revocable delegation. Irreversible or otherwise high-impact actions still require explicit human approval.

An explicit human rejection always blocks the action.

## Design Constraint

Keep the physical interface broad enough that future engineering can become more specific without forcing LunaCore's reasoning core to be rewritten around one embodiment.

The rule for v0.3 is:

> Sense generally. Represent state honestly. Preserve equilibrium. Describe intended change. Authorize before affecting the world. Leave the mechanism open.
