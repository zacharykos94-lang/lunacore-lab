# LunaCore v0.3 — Physical Change and Freshness

LunaCore may track how represented physical variables change over time without treating a recent trend as a guaranteed future state.

## Represented change

For a named physical variable, the change layer may preserve:

- latest observation
- prior observation
- elapsed represented time
- delta
- rate when two valid observations actually exist
- bounded confidence
- simple increasing, decreasing, stable, or unknown trend
- freshness / staleness

The layer does not extrapolate a future value by default.

## Freshness

A variable may optionally include a domain-supplied staleness threshold. A variable may also be marked as required for a particular class of physical action.

If a required variable is stale, LunaCore should return to observation rather than silently assuming the old state still applies.

LunaCore does not invent staleness limits. If the domain has not supplied one, freshness remains unconstrained by this layer.

## Prediction boundary

A measured rate is evidence about represented past change, not proof of continued motion.

The default v0.3 change tracker therefore preserves these invariants:

- no automatic future extrapolation
- no invented future state
- stale data remains visible
- physical action may be gated by explicitly required fresh variables
- new observations can revise the trend immediately

The design rule is:

> Track what changed. Know how old the evidence is. Do not turn a trend into destiny.
