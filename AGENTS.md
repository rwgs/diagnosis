# AGENTS.md

## Project Overview

This is a dependency-free static web app for an adult combined neurodevelopmental and anxiety screening report. It runs directly from `index.html` and does not have a package manager, build system, backend, or server requirement.

The app must remain framed as a screening and report-generation tool, not a diagnosis engine. Results are screening-match percentages and clinical discussion prompts.

## File Map

- `index.html`: Page shell, introductory clinical framing, form containers, action buttons, templates, source links, and script/style references.
- `styles.css`: Responsive UI, accessibility states, print styles, and report presentation.
- `script.js`: Question bank, mixed question display, scoring logic, required-answer validation, localStorage persistence, HTML report rendering, PDF generation, print handling, and initialization.
- `README.md`: User/developer overview. Keep it aligned with the current questionnaire count, screening scope, and run instructions.
- `questions.md`: Reference notes for candidate construct coverage. Use it to identify gaps, but keep live app wording original and do not copy licensed/proprietary assessment items.

## Running And Building

There is no build step.

To run the app, open `index.html` in a modern browser:

```powershell
Start-Process .\index.html
```

If browser launch requires approval in a sandboxed environment, ask before opening it. A local server is optional and should only be added if a future feature needs one.

## Validation Commands

Run JavaScript syntax validation after editing `script.js`:

```powershell
node --check script.js
```

Count current questions after editing the question bank:

```powershell
(Select-String -Path script.js -Pattern 'q\("').Count
```

If the question count changes, update `README.md` in the same change.

## Implementation Notes

- Keep the app dependency-free unless the user explicitly approves adding tooling.
- Use original question wording. Do not copy proprietary or copyrighted assessment items verbatim.
- When integrating from `questions.md`, prefer the construct coverage and rewrite as app-native self-report wording.
- Keep displayed questions mixed and neutrally labeled. Internal condition/domain categories can remain in metadata for scoring.
- Keep all questions required for generate, export, and print flows.
- Treat percentages as screening-match scores, not probabilities of a diagnosis.
- Keep CDS described as a research construct, not a DSM diagnosis.
- Keep legacy Asperger's wording framed as an autism-spectrum profile discussion, not a separate current DSM diagnosis.
- Autism support output should remain a Level 1/2/3-style discussion prompt, not a clinician-assigned support level.
- Keep the current pathway adult-focused. If a child or teen pathway is added, build it as a separate age-selected, multi-informant flow rather than mixing pediatric scoring into the adult self-report.
- Preserve the PDF export and browser print paths when changing report rendering.
- Answers should remain local-only unless the user explicitly asks for data upload or sync.

## Accessibility Requirements

- Do not put `aria-live` on the full questionnaire. It renders many questions at once and would be noisy for screen reader users.
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

## Editing Guidance

- Prefer small, scoped changes.
- When editing files manually, use patch-style edits.
- Keep `README.md` and app behavior synchronized on every change. Any update to questionnaire count, screening scope, scoring/report output, sources, accessibility behavior, run instructions, file map, or clinical framing should include the matching README update before the work is considered complete.
- Verify `script.js` syntax after JavaScript changes.
- If UI changes are made, check keyboard focus, mobile layout, and print/PDF behavior before considering the task complete.
