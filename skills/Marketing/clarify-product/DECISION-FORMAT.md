# Marketing Strategy Decision (MSD) Format

MSDs live in `docs/marketing-decisions/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.

Create the `docs/marketing-decisions/` directory lazily — only when the first strategic decision is made.

## Template

```markdown
# MSD-[Number]: [Short title of the strategic decision]

- **Status**: [proposed | accepted | deprecated | superseded by MSD-NNNN]
- **Date**: [YYYY-MM-DD]
- **Authors**: [Agent/User]

## Context & Problem Statement
[1-3 sentences describing the marketing challenge or strategic decision we need to make. E.g., "Which acquisition channel should we prioritize for launch?" or "Should we offer a free trial or a money-back guarantee?"]

## Decision Outcome
[The selected approach and a brief summary of why it was chosen. E.g., "We will prioritize LinkedIn organic outreach because our target audience is active there and we have zero ad budget."]

## Rejected Alternatives
[Brief list of alternatives considered and why they were rejected. E.g., "Meta Ads: Rejected due to budget constraints. Cold email: Rejected due to lack of verified lead list."]

## Consequences
- **Positive**: [e.g., Low cost, direct feedback loop]
- **Negative**: [e.g., Time-consuming, harder to scale initially]
```

## When to Create an MSD

Create an MSD only for significant marketing decisions that:
1. **Are hard to reverse** (e.g., choice of brand name, pricing models, target ICP shift).
2. **Require explanation** (e.g., why we are focusing on LinkedIn instead of Google Ads).
3. **Represent a deliberate trade-off** between budget, speed, and channel fit.
