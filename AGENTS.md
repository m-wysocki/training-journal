# AGENTS.md

## Project overview

This is a Training Journal application built with:

- Next.js
- TypeScript
- Supabase
- Tailwind CSS
- Radix UI
- SCSS Module
- Lucide-react for icons

The app is used to track workouts, muscle groups, exercises, sets, reps, and training history.

## General rules

- Preserve existing behavior unless explicitly asked to change it.
- Prefer small, incremental changes over large rewrites.
- Do not refactor unrelated parts of the application.
- Do not introduce new dependencies without approval.
- Follow existing project conventions before creating new patterns.
- Keep code readable, simple, and maintainable.
- Avoid overengineering and premature abstractions.
- Prefer explicit, understandable code over clever solutions.
- Use TypeScript properly. Avoid `any` unless there is a clear reason.
- Keep naming clear and domain-oriented.

## Styling rules

- Use SCSS Modules for component-specific styles.
- Keep styles close to the component they belong to.
- Avoid large global styles unless truly shared.
- Do not duplicate the same visual patterns in multiple places. Extract reusable styling or components when appropriate.

## Component rules

- Separate visual components from functional/container components when it improves readability.
- Visual components should focus on rendering UI.
- Functional/container components may handle data fetching, state, mutations, and business logic.
- Avoid mixing Supabase logic directly into deeply nested visual components.
- Prefer passing data and callbacks through props to presentational components.
- Keep components focused on one responsibility.
- Extract repeated UI into reusable components when the same pattern appears multiple times.
- Do not extract components too early if they are used only once and the current code is still readable.

## Refactoring rules

When refactoring:

- Preserve existing UI and behavior unless explicitly requested.
- First inspect related files and existing conventions.
- Identify duplicated UI, duplicated logic, long components, mixed responsibilities, unclear naming, and unnecessary
  complexity.
- Prefer small refactors that are easy to review.
- Do not rewrite entire files unless necessary.
- Extract reusable visual components when repetition exists.
- Extract shared logic into hooks or utility functions only when it is reused or clearly improves readability.
- Keep abstractions local before making them global.
- After refactoring, summarize what changed and why.

## Supabase rules

- Keep Supabase access predictable and easy to find.
- Avoid duplicating Supabase queries across many components.
- Prefer typed data models where possible.
- Handle loading, empty, error, and success states explicitly.
- Do not expose sensitive keys or secrets in client-side code.
- Keep database-related logic separate from purely visual UI components where practical.

## Next.js and React rules

- Use Server Components by default when possible.
- Use Client Components only when state, effects, browser APIs, or user interaction require them.
- Avoid unnecessary useEffect.
- Avoid unnecessary client-side data fetching when server-side fetching is more appropriate.
- Keep component boundaries clear.
- Avoid unnecessary re-renders and unnecessary prop drilling.
- Be careful with large imports and bundle size.

## Vercel React Best Practices

Use Vercel React Best Practices as a review checklist, especially after implementing or refactoring a feature.

Focus on:

- unnecessary "use client"
- unnecessary useEffect
- unclear Server/Client Component boundaries
- avoidable client-side rendering
- duplicated logic
- oversized components
- bundle size issues
- poor component composition
- unnecessary abstractions

Do not perform broad optimization automatically during normal feature work. Apply these practices mainly during review
or when explicitly requested.

## Workflow expectations

For new features:

1. Understand the existing structure.
2. Implement the simplest working version.
3. Keep the change focused.
4. Preserve existing behavior.
5. Avoid unrelated refactors.
6. Mention possible follow-up refactors if noticed.

For reviews:

1. Check project rules.
2. Check TypeScript correctness.
3. Check component separation.
4. Check styling consistency.
5. Check Vercel React Best Practices.
6. Suggest high-impact improvements first.

## Response format after changes

After making code changes, summarize:

- changed files
- what was implemented or refactored
- important decisions
- any assumptions
- suggested follow-up improvements
- commands run, if any