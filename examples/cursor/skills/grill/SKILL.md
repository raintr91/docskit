---
name: grill
description: /grill — Discovery router for architectural and product layers. Use with /overview, /surfaces, /business-process, /db-erd, /cross-service, /module, /journey, or /spec before authoring.
disable-model-invocation: true
extractBundle: architecture-core
---

# /grill

**Purpose:** discovery and validation router before writing or patching a target layer.

Use `/grill` when the initial brief is incomplete, when the next layer may be wrong without questioning, or when you want to prevent downstream detail from drifting away from the original requirement.

## Workflow

1. Identify the target layer from the trailing argument or from conversation context.
2. Ask a small, focused set of questions for that layer.
3. Summarize confirmed facts, open gaps, and explicit out-of-scope items.
4. Hand off to the corresponding authoring skill only after the scope is clear.

## Layer playbooks

- `/overview`: personas, business purpose, operational areas, business surfaces, common/shared boundaries.
- `/surfaces`: actor, channel, action, outcome, common vs surface-specific, API is not a surface.
- `/business-process`: actor, surface, trigger, decision, exception, outcome.
- `/db-erd`: entity, owner, lifecycle, shared vs owned data, cardinality, source of truth.
- `/cross-service`: caller/callee, sync/async, contract, retries, idempotency, events/messages, failure handling.
- `/module`: module boundary, surfaces/functions inside, common scope, dependencies.
- `/journey`: runtime flow across systems, handoffs, state transitions, recovery.
- `/spec`: actors, fields, validations, routes/actions, API contract, edge cases, acceptance.

## Question order

Prefer this order unless the target layer needs something stricter:

1. Scope and goal
2. Actors and channels
3. Boundaries and ownership
4. Happy path
5. Exceptions and edge cases
6. Shared/common scope
7. Output format and handoff

## Output

Return a short grill summary:
- confirmed scope
- missing info
- risks / assumptions
- the next skill to run

Do not author the final layer content unless the user explicitly asks you to do so.
