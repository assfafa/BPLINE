# Repository Agent Guide

- This repository contains BPLineJS and BPMatrixJS. Work inside Docker container `BPLine` at `/home/pigeon/projects/BPLine`.
- Follow `BPLineJS/AGENTS.md` for renderer work and `BPMatrixJS-memory.md` for math/geometry conventions.
- Keep only the root `README.md` as public documentation for now: project overview, Docker and npm commands.
- Do not create or update API Markdown, changelogs, documentation sites or showcase pages for routine fixes/features unless explicitly requested. This remains the default even after a separate documentation project exists.
- Formal Markdown documentation and public example pages will be organized together when the user prepares a stable release. Do not automatically recreate deleted package READMEs or docs directories.
- Preserve useful source comments/JSDoc and local verification examples; these are not public documentation. Keep agent notes concise and update them only for durable working rules, not as a per-task changelog.
- Never publish npm packages, deploy GitHub Pages or push Git commits without an explicit request.

## Local Change Notes

- Keep `CHANGES.md` as a local, Git-ignored record of completed changes, including small fixes. After each change, briefly note what changed and which package it affects.
- Before a requested commit, push, or release, review `CHANGES.md` for Markdown documentation and release-note updates that the changes require. Update the relevant existing Markdown files when appropriate; do not create new public documentation for routine work without an explicit request.
- After a release and its documentation updates are complete, clear `CHANGES.md` so the next release starts with an empty record.

## Readability

- Prefer explicit, multiline control flow over compact expressions. Do not use ternaries or negated exit guards; keep the normal work in the `if` branch and use `else` for exits when necessary.
- Keep source files ordered as imports, primary class (fields, constructor, methods), additional classes, interfaces/types, standalone helpers, exports. The primary exported class must appear immediately after imports. Preserve runtime initialization dependencies; split a local base class into a separate module when it must be initialized first. Do not put interface/type or helper blocks before the class.
- Initialize defaults directly on class fields. Constructors should assign values derived from their arguments and perform setup such as subscription binding or event registration. Preserve field initialization order and leave parameter-dependent or setup-dependent computations in the constructor; avoid making readers search the constructor for ordinary defaults.
- Every maintained directory in BPLineJS and BPMatrixJS has an `agent.md` explaining its file structure, index entry and examples, class fields and functions, other source files, behavioral constraints, and Chinese/English search keywords. Keep these descriptions synchronized with source and include library-directory guides in npm output. Example website directories are excluded from this convention.
- Functions, methods, accessors, interface methods and callbacks need meaningful JSDoc: parameter descriptions for actual parameters, `@example`, and `@returns` (including void). Do not invent parameters for parameterless functions.
- Add `//` comments explaining the intent, boundary or reason for conditionals and loops. Do not merely repeat the condition or paste unrelated generic descriptions.
- Name complex intermediate results and callbacks when this clarifies the main flow. Keep callback JSDoc beside the helper declaration rather than embedded inside long call expressions.
- Both packages share the local rules in `eslint/readability.mjs`. Preserve strict types, four-space indentation and semicolons. Readability changes must preserve behavior and should pass each package's TypeScript and ESLint checks.
