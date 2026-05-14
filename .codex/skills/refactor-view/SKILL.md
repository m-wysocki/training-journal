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
- For view-level technical folders, use private naming with an underscore prefix: `_components`, `_hooks`, `_helpers`.
- When creating a new custom React hook, place it in a local `_hooks/` folder near the feature (or the project-level
  `_hooks/` directory when shared).
- When extracting logic to helpers, create/use a local `_helpers/` folder for that feature and place all related
  helper files there.

Use SCSS Modules for component-specific styles.
- Keep styles close to the component they belong to.
- Each styled component should have its own `ComponentName.module.scss` file. Do not keep component styles in a
  different component's stylesheet.
- Use PascalCase class names based on the component and its elements, for example `Header`, `HeaderLogo`,
  `HeaderButton`.
- In SCSS Modules, nest related element styles under the base component class when it matches the class naming pattern:
  `.Header { &Logo { ... } }`.
- Avoid large global styles unless truly shared.
- Do not duplicate the same visual patterns in multiple places. Extract reusable styling or components when appropriate.


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