# LunaCore v0.3 — General Physical Interface

LunaCore v0.3 begins an intentionally mechanism-agnostic interface to the physical world.

The purpose of this layer is not to decide what body, robot, vehicle, fluid system, display, sensor package, or other embodiment LunaCore must use. It defines only the minimum concepts needed for future physical sensing and action while preserving room for technologies and media that do not yet exist.

## General Flow

External World
→ Sensory Channels
→ Multi-Sensor State Estimate
→ Physical State / Environment
→ Equilibrium / Stability
→ Desired State Region
→ Bounded Feedback Decision
→ LunaCore Reasoning
→ Human Authorization
→ Output / Physical Interaction
→ New Sensory Input

## Sensory Input

Sensory input is represented as extensible named channels rather than a fixed list of human senses.

Examples may include visual, acoustic, pressure, temperature, chemical, field, position, contact, flow, or future sensing methods. These are examples only.

Visual input is therefore supported without making vision mandatory or privileged.

## Multi-Sensor State Estimation

Different sensory channels may observe the same physical variable.

LunaCore may combine those measurements into a bounded state estimate using their confidence values, while preserving the source of every measurement.

No sensor type is automatically authoritative. Visual input does not outrank pressure, acoustic, field, contact, flow, or future sensing merely because it is visual.

For each estimated variable, LunaCore preserves:

- estimated value
- bounded confidence
- minimum and maximum observed values
- measurement spread
- contributing sources
- whether the observations conflict under a supplied tolerance

A conflict tolerance is optional because meaningful disagreement depends on the variable and its units. If no meaningful tolerance has been supplied, LunaCore reports the spread but does not invent a conflict threshold.

When sensors conflict, confidence is reduced and the disagreement remains visible. The system should prefer additional observation over silently selecting a winning sensor.

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

## Desired State and Feedback

LunaCore represents a desired physical condition as a general state region rather than as a hardware command.

A state region may use a minimum, maximum, target, or tolerance for a named physical variable. The variable name and units are intentionally open.

The feedback layer can return four high-level dispositions:

- **observe** — uncertainty or confidence is not good enough to justify change
- **hold** — the represented physical state is already within the desired region
- **stabilize** — equilibrium takes priority before optional movement or interaction
- **adjust** — a bounded change may be useful, followed by immediate re-observation

The feedback layer deliberately does not specify direct actuator commands. It does not know whether an adjustment would eventually be produced by a wheel, limb, pressure gradient, fluid flow, field, deformation, buoyancy change, or another mechanism.

Adjustment scale is bounded and becomes smaller as uncertainty or change cost increases. Every physical change is followed by re-observation rather than assuming the intended effect occurred.

This creates a general loop:

**sense → estimate → compare → hold/stabilize/adjust → re-sense**

The goal is not maximum motion or perfect control. The goal is maintaining a useful relationship with the physical environment while preserving stability, uncertainty, reversibility, and human agency.

## Physical Interaction and Human Agency

A physical recommendation is not authorization to act.

Physical interaction is routed through LunaCore's human authorization layer. Reversible, bounded physical actions may later operate under explicit scoped and revocable delegation. Irreversible or otherwise high-impact actions still require explicit human approval.

An explicit human rejection always blocks the action.

The feedback layer therefore produces a recommendation about physical state, not permission to affect the world.

## Design Constraint

Keep the physical interface broad enough that future engineering can become more specific without forcing LunaCore's reasoning core to be rewritten around one embodiment.

The rule for v0.3 is:

> Sense generally. Preserve disagreement. Represent state honestly. Preserve equilibrium. Compare against a desired region. Change only what is justified. Re-observe. Authorize before affecting the world. Leave the mechanism open.
