# Repository Agent Guide

- This repository contains BPLineJS and BPMatrixJS. Work inside Docker container `BPLine` at `/home/pigeon/projects/BPLine`.
- Follow `BPLineJS/AGENTS.md` for renderer work and `BPMatrixJS-memory.md` for math/geometry conventions.
- Keep only the root `README.md` as public documentation for now: project overview, Docker and npm commands.
- Do not create or update API Markdown, changelogs, documentation sites or showcase pages for routine fixes/features unless explicitly requested. This remains the default even after a separate documentation project exists.
- Formal Markdown documentation and public example pages will be organized together when the user prepares a stable release. Do not automatically recreate deleted package READMEs or docs directories.
- Preserve useful source comments/JSDoc and local verification examples; these are not public documentation. Keep agent notes concise and update them only for durable working rules, not as a per-task changelog.
- Never publish npm packages, deploy GitHub Pages or push Git commits without an explicit request.

## Readability

- Prefer explicit, multiline control flow over compact expressions. Do not use ternaries or negated exit guards; keep the normal work in the `if` branch and use `else` for exits when necessary.
- Functions, methods, accessors, interface methods and callbacks need meaningful JSDoc: parameter descriptions for actual parameters, `@example`, and `@returns` (including void). Do not invent parameters for parameterless functions.
- Add `//` comments explaining the intent, boundary or reason for conditionals and loops. Do not merely repeat the condition or paste unrelated generic descriptions.
- Name complex intermediate results and callbacks when this clarifies the main flow. Keep callback JSDoc beside the helper declaration rather than embedded inside long call expressions.
- Both packages share the local rules in `eslint/readability.mjs`. Preserve strict types, four-space indentation and semicolons. Readability changes must preserve behavior and should pass each package's TypeScript and ESLint checks.
