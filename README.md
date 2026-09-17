# LunaCore Lab

LunaCore is an experimental TypeScript decision-support core centered on human agency, bounded learning, transparent provenance, adaptive support, and explicit authorization boundaries.

## v0.2 capabilities

- active support calibrated by likelihood, severity, reversibility, and uncertainty
- context and stated purpose weighting
- presence, leisure, creative exploration, and strategic stillness
- renewable-energy and reserve stewardship
- secure-shelter-first resilience logic
- bounded outcome learning that cannot turn history into identity
- structured decision provenance without exposing private chain-of-thought
- centralized human authorization for external or high-impact actions
- integrated `runLunaCore` orchestration
- GitHub Actions CI for tests and strict TypeScript checks

## Core principle

A good system should know when to act, when to create, when to enjoy, and when to remain still.

Reasoning, recommendation, and authorization are separate. A recommendation never grants permission to perform a real-world action.

## Run locally or in Codespaces

```bash
npm install
npm test
npm run check
npm start
```

## Architecture

The current v0.2 flow is:

```text
Faith / Values
→ Context & History
→ Purpose
→ Risk & Uncertainty
→ Support Level
→ Engagement Mode
→ Resource / Shelter Stewardship
→ Decision Trace / Provenance
→ Human Choice / Authorization
→ Outcome / Learning
```

See `docs/architecture-v0.2.md` for the detailed constraints and invariants.

## Development policy

New behavior should preserve human agency, uncertainty, reversibility, provenance, and explicit approval for high-impact actions. Tests and `npm run check` should pass before merging changes into the active v0.2 branch.
