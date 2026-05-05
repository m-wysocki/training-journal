---
name: refactor-view
description: Use this skill when refactoring an existing view to improve structure, reusability, and separation between UI and logic.
---

# Refactor View Skill

## Goal

Refactor an existing view without changing its behavior.

Focus on:

- splitting large components
- extracting reusable UI
- improving readability
- separating logic from presentation

## Important

Follow all global rules defined in AGENTS.md.

Do not repeat or override them here.

## Process

1. Inspect the selected view and related files.
2. Identify:
    - large components
    - duplicated JSX
    - mixed UI and logic
    - unclear responsibilities
3. Propose a short refactor plan before editing.
4. Apply changes in small steps.
5. Refactor only what is necessary.

## Component separation

Prefer separating:

- container components (data, state, logic)
- presentational components (UI, props, layout)

Do this only when it improves readability.

## Extraction heuristics

Extract when:

- UI pattern repeats
- component is too long
- responsibility is mixed
- naming becomes unclear

Avoid extracting when:

- used only once and still readable
- abstraction adds complexity
- data flow becomes harder to follow

## Logic separation

Move logic out of UI when:

- component becomes hard to read
- state + handlers dominate the file
- logic can be reused

Keep logic in place when it is simple and local.

## Workflow style

- Work incrementally
- Do not rewrite whole files
- Do not touch unrelated areas
- Prefer clarity over abstraction

## Output

Summarize:

- changed files
- extracted components
- separated logic
- what improved
- follow-up suggestions