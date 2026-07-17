# Clarify Product

A foundational product discovery and marketing positioning skill designed to map out product features, benefits, target personas, customer pain points, and terminology.

## What it is

`clarify-product` is the entry point of the marketing workflow. Inspired by the interactive coding design interview (`grill-me-with-docs`), it runs a conversational, persistent interview to drill down on what a product does, who it is for, and how it should be positioned. 

It compiles this information into two deliverables:
1. `PRODUCT-CONTEXT.md` - The single source of truth for marketing terminology, ICP, pain points, and benefit tables.
2. `docs/marketing-decisions/` - A sequential log of major marketing and strategic positioning decisions.

## When to use it

Use this skill:
- At the very beginning of a new marketing project or campaign.
- When an agent needs to write website copy, landing pages, or email sequences but lacks details on the target customer or unique value proposition.
- When aligning on brand voice, preferred terms, or competitor positioning.
- Before running other marketing skills (like `copywriting`, `email-sequence`, or `competitor-alternatives`).

## How to use

1. Trigger the skill by prompting the agent: *"Let's clarify the product"* or *"Create a product context document"*.
2. The agent will ask you targeted questions about your product, audience, and differentiator.
3. As details are agreed upon, the agent will dynamically write to `PRODUCT-CONTEXT.md` at the root of your workspace.
4. For major positioning choices, the agent will create a Marketing Strategy Decision (MSD) log.

## Example Campaign Build Chain

This skill is designed to kick off the main marketing campaign build chain:
```
clarify-product ──> copywriting ──> page-creation ──> page-cro
```
By defining terminology and personas first, all downstream assets (copy, emails, landing pages) stay perfectly aligned.
