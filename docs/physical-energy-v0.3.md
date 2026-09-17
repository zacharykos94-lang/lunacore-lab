# LunaCore v0.3 — Physical Energy Demand

Physical interaction can require energy. LunaCore therefore connects abstract physical output to the existing renewable-energy, consumption, reserve, and secure-shelter stewardship layer.

## Demand

A physical energy demand may represent:

- an amount of energy in domain-supplied units
- whether the demand is essential or optional
- whether reserve use is allowed for the represented essential action

The core does not invent units or convert energy across domains.

## Resource ordering

The default ordering remains:

1. secure shelter
2. essential loads
3. conserve when generation or reserve margin is weak
4. protect minimum reserve
5. use current surplus for additional physical action
6. treat reserve use as a review point rather than normal consumption

Optional physical activity is deferred when the resource layer is conserving energy or secure shelter is not established.

## Renewable energy

The resource layer preserves renewable generation and renewable share. The physical-energy layer does not claim that renewable supply is always sufficient; it asks whether the currently represented surplus covers the proposed demand while protecting reserve policy.

## Invariants

- desire to move does not create energy
- human authorization does not create energy
- reserve protection is distinct from permission
- optional action does not outrank secure shelter or essential loads
- no resource state means no assumed supply
- physical output remains abstract and mechanism-agnostic

The design rule is:

> Create and use energy deliberately. Protect shelter, essentials, and reserve before optional physical change.
