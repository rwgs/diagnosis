# Adult Combined Screening Report

A standalone static web app for an adult-focused combined screening report across ADHD, autism spectrum traits, AuDHD co-occurrence, legacy Asperger's-style profile, OCD, cognitive disengagement syndrome, anxiety, and differential factors.

The app is designed to help an adult organize symptoms, onset, impairment, masking/compensation, support needs, and overlapping patterns into a report that can be discussed with a qualified health professional.

## Clinical Framing

- This app does not diagnose. It produces screening-match percentages and clinician discussion notes.
- The percentages are not diagnostic probabilities and are not a substitute for formal assessment.
- CDS is included as a research construct, not a DSM diagnosis.
- Asperger's disorder is no longer a separate DSM diagnosis; the report frames it as a legacy profile under autism spectrum discussion.
- Autism support level is reported as a Level 1/2/3-style discussion prompt, not as a clinician-assigned DSM support level.
- Safety and differential flags are prompts to seek appropriate clinical review, especially for current harm risk, mania/hypomania, psychosis-like experiences, sleep, mood, trauma/stress, substance/medical, and learning/language factors.

## Running The App

Open `index.html` in a modern browser. No install, build step, package manager, or server is required.

Answers are stored only in the browser's local storage on the current device.

## Current Questionnaire

- 145 required questions.
- Adult-focused wording.
- Questions are displayed in mixed neutral parts rather than grouped by condition.
- Frequency answer choices include concrete definitions.
- Users are instructed to answer for the last 6 months unless a question asks about childhood or earlier life.
- Users are instructed to count effort, compensation, masking, avoidance, and recovery time, not only what other people can see.
- All questions must be answered before a report can be generated, exported, or printed.

## Screening Coverage

The questionnaire uses original wording mapped to constructs covered by established tools and clinical criteria. Named instruments are not copied.

- ASRS-v1.1 and ASRS-5: adult DSM ADHD symptom domains, onset, impairment, settings, and differential flags.
- ESQ-R: planning, time management, task initiation, working memory, organization, emotional control, behavioral regulation, flexibility, self-monitoring, and stress tolerance.
- RAADS-R and RAADS-14: social relatedness, pragmatic language, sensory-motor profile, restricted interests, mentalizing, social anxiety, and sensory reactivity.
- Autism-Spectrum Quotient: social skill, attention switching, attention to detail, communication, and imagination/abstraction.
- CAT-Q: compensation, masking, and assimilation.
- Empathy Quotient: cognitive empathy/mentalizing, emotional reactivity, empathic response expression, and social skill context.
- OCD coverage: obsessions, compulsions, mental rituals, avoidance, distress/interference, control/resistance, accommodation, time burden, insight, tic-related patterns, common OCD themes, hoarding-related themes, and body-focused repetitive behaviors.
- Anxiety coverage: generalized worry, physiological symptoms, avoidance, intolerance of uncertainty, panic-like symptoms, and social-evaluative anxiety.
- CDS coverage: cognitive fog, hypoactivity, slow processing, daydreaming, and differentiation from sleep/mood/medical factors.

## Report Output

The generated report includes:

- Overall screening-match percentages for ADHD, autism spectrum, AuDHD pattern, legacy Asperger's-style profile, OCD, CDS, and anxiety.
- ADHD presentation discussion, including inattentive, hyperactive/impulsive, and combined-style patterns.
- Autism-spectrum domain breakdown and support-level discussion.
- OCD theme and severity breakdown.
- Differential and safety flags.
- Suggested clinical discussion points.
- Clinical framing sources.

Reports can be exported directly as a PDF or printed from the browser.

## Accessibility And UX

- The progress track uses ARIA progressbar attributes.
- Results use `aria-live="polite"` because they update dynamically.
- The questionnaire is not a live region, avoiding noisy screen reader announcements during initial render.
- Focus moves to the results heading after report generation or export.
- Missing questions are highlighted and the app scrolls to the first unanswered item when report generation is attempted too early.

## Development

This project is intentionally dependency-free:

- `index.html` contains the document structure and source links.
- `styles.css` contains responsive layout and print styles.
- `script.js` contains the question bank, scoring, rendering, persistence, validation, PDF generation, and event handlers.

Useful checks:

```powershell
node --check script.js
(Select-String -Path script.js -Pattern 'q\("').Count
```

Primary references are linked in the app's Sources section.
