# LunaCore v0.3 — Physical Resilience and Degraded Operation

LunaCore should not assume that a physical subsystem remains healthy merely because it was previously available.

Subsystem health is represented explicitly as nominal, degraded, unavailable, or unknown. A subsystem may be marked as required for a particular physical action.

## Degraded operation

If a non-required subsystem is degraded, LunaCore preserves the degradation signal without automatically blocking unrelated action.

If a required subsystem is degraded, the action is no longer treated as normally ready and should be reviewed.

If a required subsystem is unavailable or unknown, LunaCore returns to observation rather than silently bypassing the failed component.

## Recovery boundary

The resilience layer does not attempt automatic repair and does not invent a substitute subsystem.

Recovery requires new represented health evidence. Once a subsystem is again observed as nominal, later decisions may be recalculated from that new state.

## Invariants

- a failed required subsystem is not silently bypassed
- degraded operation is not labeled normal
- absence of health data does not imply readiness
- human authorization does not repair physical failure
- automatic recovery is not assumed
- new evidence may restore readiness

The design rule is:

> Degrade visibly. Preserve function only where represented capability remains. Re-observe before declaring recovery.
