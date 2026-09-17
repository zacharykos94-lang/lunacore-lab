# LunaCore v0.3 — Physical Capability Awareness

LunaCore separates **desired physical effect** from **available physical capability**.

A capability is represented abstractly by a name, one or more open-ended roles, availability, confidence, and optionally a medium. The core does not define a permanent hardware taxonomy.

Examples of roles might include sensing, stabilizing, signaling, state change, transport, manipulation, or future roles not yet anticipated.

## Requirements

A physical task may state explicit capability requirements. Requirements may include a minimum confidence and may be marked as required for action.

If a required capability is unavailable or below the supplied confidence threshold, LunaCore returns to observation rather than assuming a replacement mechanism exists.

Capabilities that are not required for the current action may be reported as degraded without automatically blocking unrelated behavior.

## Invariants

- capability is not inferred from desire
- missing capability is not silently replaced
- no mechanism is selected by this layer
- confidence thresholds are supplied by the domain, not invented by LunaCore
- human authorization cannot create a capability that is not represented
- future embodiments may satisfy the same abstract role in completely different ways

The design rule is:

> Know what effect is wanted. Know what capability is actually available. Never confuse the two.
