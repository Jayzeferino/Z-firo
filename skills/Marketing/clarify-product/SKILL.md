---
name: clarify-product
description: >-
  Relentless interactive interview to explore, map out, and document a product's marketing positioning, personas, pain points, differentiators, and core benefits before starting copywriting or campaign tasks.
category: Marketing
triggers:
  - clarify product
  - product context
  - set up marketing context
  - understand product
  - product positioning
  - ICP definition
  - marketing strategy interview
related_skills:
  - copywriting
  - page-cro
  - email-sequence
  - competitor-profiling
---

# Clarify Product

Actively explore, map out, and document the product's marketing positioning in collaboration with the user (the marketer). This skill acts as the entry point of the main marketing campaign build chain:

```
[clarify-product] ──> [copywriting] ──> [landing page creation] ──> [page analysis / CRO]
```

Your goal is to conduct a structured, friendly but relentless interview to map the product characteristics, personas, pain points, benefits, and competitive positioning into structured documents.

## Artifacts Managed

1. **`PRODUCT-CONTEXT.md`**: Created at the root of the marketing workspace. It stores the single source of truth for the product description, personas, pain points, features mapping, and terminology.
2. **`docs/marketing-decisions/`**: Directory where sequential files (e.g., `0001-launch-channel.md`) are saved to record key strategic marketing trade-offs (Marketing Strategy Decisions - MSDs).

Create these files lazily. If `PRODUCT-CONTEXT.md` does not exist, create it as soon as the first terms and details are resolved.

---

## The Discovery Interview Process

### 1. Probe Beyond Surface Descriptions
When the user describes the product, do not just accept generic definitions. Ask clarifying questions:
- *User says*: "It's a fast CRM."
- *You probe*: "Who is it fast for? What makes it faster than HubSpot or Salesforce? Is it the interface, the load speed, or a simplified setup?"

### 2. Map Concrete Customer Pain Points
Avoid abstract problems. Identify real-world frustrations:
- *Abstract*: "Users want to save time."
- *Concrete*: "Users spend 2 hours every Friday manually exporting CSV files from Facebook Ads and importing them into Excel."

### 3. Translate Features into Outbound Benefits
For every product feature mentioned, force a translation to a benefit:
- *Feature*: "Automated scheduling system."
- *Benefit*: "Book client meetings automatically without back-and-forth emails, reducing booking drop-off by 30%."

### 4. Establish a Ubiquitous Marketing Vocabulary
Ask which terms the brand prefers and which ones they actively avoid to maintain consistency in all copy:
- *Use*: "Workspace" | *Avoid*: "Project dashboard"
- *Use*: "Client portal" | *Avoid*: "Admin panel"

---

## Session Workflow

### Step 1: Active Interviewing
Ask 1-2 targeted questions at a time. Do not overwhelm the user with a giant questionnaire. Start with the product's core promise and target audience.

### Step 2: Update PRODUCT-CONTEXT.md
As soon as details crystallize (e.g. you agree on the primary target persona or a specific pain point), write to or update `PRODUCT-CONTEXT.md` using the format in `PRODUCT-CONTEXT-FORMAT.md`. Update it inline during the conversation so the user can see it evolve.

### Step 3: Strategize & Record Decisions (MSDs)
When significant marketing choices are discussed (e.g., pricing strategy, primary channel focus, risk-reversal guarantees), suggest creating a Marketing Strategy Decision (MSD) document inside `docs/marketing-decisions/` following the `DECISION-FORMAT.md` template.
