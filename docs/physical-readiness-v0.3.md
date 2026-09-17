# LunaCore v0.3 — Physical Foundation Readiness

The physical readiness summary does not create new authority or choose a mechanism. It only summarizes the physical gates already represented elsewhere in LunaCore.

Possible summary states are:

- **observe** — the represented physical state does not yet justify change
- **stabilize** — equilibrium should be restored before optional change
- **review** — a prerequisite needs human review or fresh evidence
- **blocked** — an explicit blocking condition exists, such as human rejection or a hard physical constraint
- **ready** — the currently represented gates are clear for an already-authorized abstract output

## Inputs to the summary

The summary may consider:

- physical-interface readiness
- feedback disposition
- known or unknown spatial transition
- sensor disagreement
- stale required physical variables
- capability readiness
- subsystem health / resilience
- physical constraint status
- human authorization status
- abstract output status

## Invariants

- readiness is not authorization
- readiness is not proof of real-world safety
- no hardware mechanism is inferred
- missing evidence does not become positive evidence
- blocked and review states preserve the reason
- the summary cannot override upstream gates

The design rule is:

> Summarize the represented gates. Do not erase why a gate is closed. Do not turn readiness into authority.
