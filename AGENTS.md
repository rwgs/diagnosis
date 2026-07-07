# AGENTS.md

## Project Overview

This is a dependency-free static web app for an adult combined neurodevelopmental and anxiety screening report. It runs directly from `index.html` and does not have a package manager, build system, backend, or server requirement.

The app must remain framed as a screening and report-generation tool, not a diagnosis engine. Results are screening-match percentages and clinical discussion prompts.

## File Map

- `index.html`: Page shell, introductory clinical framing, form containers, action buttons, templates, source links, and script/style references.
- `styles.css`: Responsive UI, accessibility states, print styles, and report presentation.
- `questions.js`: Live question bank, answer-choice definitions, display chunk size, and condition labels exported as `window.SCREENING_QUESTION_DATA`.
- `scoring.js`: Pure scoring core (no DOM). Weight vectors (`WEIGHTS`), discriminator caps, condition scorers, validity flags, threshold labels, and `buildContext`/`buildReport`. Loaded as a classic `<script>` before `script.js` (its top-level functions become browser globals) and also `module.exports`ed for `tests.js` in Node.
- `script.js`: Mixed question display, form reading, required-answer validation, localStorage persistence, HTML report rendering, PDF generation, print handling, and initialization. `scoreAssessment()` is a thin wrapper that reads the form and calls `buildReport()` in `scoring.js`.
- `tests.js`: Dependency-free regression suite for `scoring.js`, run with `node tests.js`. Asserts weight sums, discriminator caps, validity-flag boundaries, threshold labels, and a golden full-report baseline over the whole question bank.
- `README.md`: User/developer overview. Keep it aligned with the current questionnaire count, screening scope, and run instructions.
- `QUESTIONS.md`: Reference notes for candidate construct coverage. Use it to identify gaps, but keep live app wording original and do not copy licensed/proprietary assessment items.
- `TASKS.md`: Accuracy and coverage backlog. Tracks the status of planned improvements (done vs. pending) and the suggested implementation order for remaining work.

## Running And Building

There is no build step.

To run the app, open `index.html` in a modern browser:

```powershell
Start-Process .\index.html
```

## Validation Commands

Run JavaScript syntax validation after editing `questions.js`, `scoring.js`, or `script.js`:

```powershell
node --check questions.js
node --check scoring.js
node --check script.js
```

Run the scoring regression suite after any change to `scoring.js` (or to scoring weights, thresholds, discriminator, or validity logic):

```powershell
node tests.js
```

`tests.js` asserts that every `WEIGHTS` vector sums to 1.00, so the "verify weights still sum to 1.00" step is now automated rather than manual. If a scoring change is intentional, update the golden baseline in `tests.js` in the same commit.

Count current questions after editing the question bank:

```powershell
(Select-String -Path questions.js -Pattern 'q\("').Count
```

This counts every item, including the optional strengths section. The **required** count (the number that gates report generation and appears in `README.md`) is this total minus the optional items — currently 225 total = 218 required + 7 optional strengths (`condition: "strengths"`, in the `optional: true` section). If the required count changes, update `README.md` in the same change.

## Implementation Notes

- Keep the app dependency-free unless the user explicitly approves adding tooling.
- Use original question wording. Do not copy proprietary or copyrighted assessment items verbatim.
- When integrating from `QUESTIONS.md`, prefer the construct coverage and rewrite as app-native self-report wording.
- Keep displayed questions mixed and neutrally labeled. Internal condition/domain categories can remain in metadata for scoring.
- Keep all **required** questions required for generate, export, and print flows. The only exception is a section flagged `optional: true` (currently the strengths module): its items are rendered separately after the mixed required flow, do not gate generate/export/print, are excluded from the progress meter and completion count, and feed no condition percentage. If you add or remove optional items, do **not** bump `STORAGE_VERSION` (they invalidate no saved answers) — `meta.questionCount` and the restore guard track only the required count.
- Strengths items (`condition: "strengths"`) are unscored disclosure aids surfaced as a "Reported strengths" list via `buildStrengths()` in `scoring.js`; keep them out of every condition scorer.
- Treat percentages as screening-match scores, not probabilities of a diagnosis.
- Keep CDS described as a research construct, not a DSM diagnosis.
- Keep legacy Asperger's wording framed as an autism-spectrum profile discussion, not a separate current DSM diagnosis.
- Autism support output should remain a Level 1/2/3-style discussion prompt, not a clinician-assigned support level.
- Keep the current pathway adult-focused. If a child or teen pathway is added, build it as a separate age-selected, multi-informant flow rather than mixing pediatric scoring into the adult self-report.
- Preserve the PDF export and browser print paths when changing report rendering.
- Answers should remain local-only unless the user explicitly asks for data upload or sync.

## Accessibility Requirements

- Do not put `aria-live` on the full questionnaire. It renders many questions at once and would be noisy for screen reader users.
- Keep each question row wired as a `radiogroup`: `role="radiogroup"` with `aria-labelledby` referencing the question code and copy ids and `aria-describedby` referencing the help id, so a screen reader user hears which question an answer group belongs to instead of only the first option label.
- Keep `aria-live="polite"` on results because that section updates after scoring.
- Keep the progress track wired as a progressbar and update `aria-valuenow` and `aria-valuetext` with visual progress.
- After generating or exporting results, move focus to the results heading.
- Preserve visible missing-answer feedback, first-missing-question focus/scroll behavior, and the guided flow that advances to the next missing question after the highlighted one is answered.

## Clinical Safety Requirements

- Keep immediate-danger language in the intro.
- Keep current safety risk in the differential/safety flags.
- Keep mania/hypomania and psychosis-like experiences as priority differential prompts.
- When adding conditions or domains, add report notes that explain limitations and what a clinician should review.
- Avoid wording that implies the app can confirm, rule out, or formally diagnose a disorder.

## Command execution (Bitdefender on Windows)

What to avoid is *suspicious* automation, which AV heuristics may block.

**NEVER use encoded or obfuscated commands — Bitdefender flags them every time.**
This is the single most common cause of blocked commands here, so treat it as a
hard rule:
- **Do not** use PowerShell `-EncodedCommand` / `-enc`, base64-encoded payloads,
  `[Convert]::FromBase64String`, compressed/gzipped script blobs, or any
  string-obfuscated command. Always pass plain, human-readable command text.
- **Do not** let any tool or wrapper base64-encode a command on your behalf. If
  an approach would require encoding to get through, choose a different approach
  (a direct file edit, a short readable command, or a small `.ps1` script) —
  never encode it to make it run.
- No long generated one-liners that rewrite files — **prefer direct file edits**
  (Edit/Write) over shell-based search/replace.
- Keep commands short, explicit, and readable; don't chain many together.
- Never touch the registry, startup items, scheduled tasks, or AV/security settings.
- If a command is blocked or likely to trip AV heuristics, stop and propose the
  smallest safe manual alternative.


## Editing Guidance

- Prefer small, scoped changes.
- When editing files manually, use patch-style edits.
- Keep `README.md` and app behavior synchronized on every change. Any update to questionnaire count, screening scope, scoring/report output, sources, accessibility behavior, run instructions, file map, or clinical framing should include the matching README update before the work is considered complete.
- Keep `TASKS.md` in sync when backlog work is started, completed, or re-prioritized. When a tier or item from the backlog is implemented, move it from pending to done in the status table at the top of `TASKS.md`, replace the planning description with the concrete IDs and scoring-layer details that were added, and update the suggested implementation order so the next reader sees only the remaining work.
- Keep scoring logic in `scoring.js` and DOM/rendering logic in `script.js`. New condition scorers, weights, thresholds, discriminator, or validity logic belong in `scoring.js` so they stay testable; add or update assertions in `tests.js` for them.
- Verify `questions.js`, `scoring.js`, and `script.js` syntax after JavaScript changes, and run `node tests.js`.
- If UI changes are made, check keyboard focus, mobile layout, and print/PDF behavior before considering the task complete.
