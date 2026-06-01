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

- 217 required questions.
- Adult-focused wording.
- Questions are displayed in mixed neutral parts rather than grouped by condition.
- Frequency answer choices include concrete definitions.
- Users are instructed to answer for the last 6 months unless a question asks about childhood or earlier life.
- Users are instructed to count effort, compensation, masking, avoidance, and recovery time, not only what other people can see.
- All questions must be answered before a report can be generated, exported, or printed.

## Screening Coverage

The questionnaire uses original wording mapped to constructs covered by established tools and clinical criteria. Named instruments are not copied, and no score from this app should be treated as equivalent to a licensed or validated instrument score.

Primary ADHD coverage:

- DSM-style adult ADHD domains: inattention, hyperactivity/impulsivity, split childhood-onset support for inattentive and hyperactive/impulsive traits, impairment, and symptoms across settings.
- ASRS-v1.1 and ASRS-5-style coverage: adult ADHD screening constructs, frequency framing, impairment prompts, and clinical follow-up signals.
- DIVA-5-style structure: adult symptoms, childhood symptoms, domain-specific adult impairment, cross-setting impact, collateral-history prompts, and differential review using original wording.
- ADHD presentation discussion: predominantly inattentive, predominantly hyperactive/impulsive, combined-style, and subthreshold trait patterns.

Supporting ADHD context:

- ESQ-R-style executive-function profile: planning, time management, task initiation, working memory, organization, emotional control, behavioral inhibition, flexibility, self-monitoring, and stress tolerance.
- DIVA-5/CAARS-style adult impact domains: work/education, relationships, daily living, emotional lability, and self-concept effects.
- Conners/CATA-style attention variability domains: vigilance under monotony, inconsistent performance, and processing-speed variability.
- Hyperfocus and rejection sensitivity are included as adult discussion domains. They can be clinically useful but are not DSM ADHD criteria and should not drive diagnosis by themselves.
- Trait stability prompts (lifelong continuity and symptom-free intervals) inform ADHD and autism-spectrum gate scoring so episodic patterns can be differentiated from continuous neurodevelopmental ones.

Primary autism-spectrum coverage:

- DSM-style adult autism domains: social-emotional reciprocity, nonverbal communication, relationships, repetitive behavior/speech, sameness/transitions, focused interests, and sensory profile.
- ADOS-2-style construct coverage: social affect, reciprocal interaction, social initiation, nonverbal communication, narrative/event description, idiosyncratic language, social insight, and restricted/repetitive behavior themes using self-report wording rather than observational scoring.
- ADI-R-style developmental-history coverage: early social-communication traits, early restricted/repetitive or sensory traits, joint-attention/showing markers, childhood requesting style, pronoun/private-language markers, developmental regression history, language/developmental context, and collateral-history prompts.
- MIGDAS-2-style construct coverage: sensory-first internal experience, interests, communication style, humor/irony processing, social exit cues, body-in-space/motor differences, and qualitative support needs using original self-report wording.
- RAADS-R / RAADS-14-style coverage: adult social relatedness, pragmatic language, sensory reactivity, restricted interests, mentalizing, and social anxiety overlap.
- Autism-Spectrum Quotient-style coverage: social skill, attention switching, attention to detail, communication, and imagination/abstraction.
- RBQ-2A/RBQ-3-style coverage: adult restricted and repetitive behavior themes, including repetitive sensory-motor behavior, insistence on sameness, restricted interests, sensory fascination, and repetitive language.

Supporting autism-spectrum context:

- CAT-Q-style camouflaging profile: compensation, masking, and assimilation.
- Empathy Quotient-style discussion: cognitive empathy/mentalizing, emotional reactivity, empathic response expression, and social skill context.
- Alexithymia, interoception, autistic burnout, and legacy Asperger's-style profile are included as adult discussion domains. They are relevant to presentation and support planning, but they are not standalone autism diagnostic criteria.
- Late-presenting and masked-autism prompts: interest-content style, fluent social mimicry, and adult self-recognition pathway help reduce false negatives in adults whose autism was not flagged in childhood.
- Autism support level is estimated only as a discussion prompt. DSM support levels must be assigned by a clinician.

Boundary discrimination and response-quality layer:

- Pattern-clarification items use a forced-choice format to discriminate constructs that look similar on independent items: ADHD-PI vs. CDS attention drift, ADHD enthusiasms vs. autistic special interests, ADHD-compensatory rigidity vs. autistic sameness, and ADHD fidget vs. autistic stim. Each item adjusts the relevant condition scores by a small bounded amount.
- Validity layer: reverse-scored items, an infrequency probe, and consistency-pair items run as a meta-layer that does not change symptom percentages but flags careless, acquiescence-biased, or inconsistent responding for clinical review.

CDS coverage:

- CDS is covered as a non-DSM research construct with cognitive fog, mind-wandering/daydreaming, hypoactivity, slow processing, withdrawal, and differentiation from ADHD inattention, sleep, mood, medication/substance, and medical factors.
- The app is closer to an Adult Concentration Inventory/Barkley CDS-style construct map than a diagnostic instrument, because CDS currently has no DSM diagnosis.

Other coverage:

- OCD: obsessions, compulsions, mental rituals, avoidance, distress/interference, control/resistance, accommodation, time burden, insight, tic-related patterns, common OCD themes, hoarding-related themes, and body-focused repetitive behaviors.
- Anxiety: generalized worry, physiological symptoms, avoidance, intolerance of uncertainty, panic-like symptoms, social-evaluative anxiety, and 6+ month duration.
- Differential flags: sleep/circadian disruption, sleep apnea/daytime sleepiness, mood/depression, burnout, trauma/stress/dissociation, substance/medication effects, medical factors, mania/hypomania, psychosis-like experiences, learning/language/coordination history, self-harm risk, and harm-to-others risk.

## Tool Relevance For ADHD, CDS, And ASD

Most relevant to the app's main purpose:

- ADHD: DSM symptom domains, ASRS-v1.1, ASRS-5, DIVA-5-style lifetime/domain-impairment structure, CAARS/CAARS-2-style adult impairment/self-concept/emotional-lability framing, Conners/CATA-style vigilance and variability constructs, onset, and multiple-setting checks.
- ASD: DSM social-communication and restricted/repetitive behavior domains, ADOS-2/ADI-R/MIGDAS-2-style diagnostic constructs, AQ-style traits, RAADS-style adult autistic traits, RBQ-style repetitive behavior coverage, CAT-Q-style masking/camouflaging, and adult sensory/motor qualitative profile.
- CDS: adult CDS/SCT research domains such as cognitive fog, daydreaming, hypoactivity, slowed processing, and differentiation from ADHD inattention.

Useful but should be weighted cautiously:

- ESQ-R-style executive skills: useful for function and accommodations, but not diagnostic by itself.
- CAT-Q-style camouflaging: useful because masking can hide ASD traits, but it measures compensation/masking rather than autism itself.
- Empathy Quotient-style items: useful for social-cognitive discussion, but empathy measures can be misunderstood and should not be used alone to support or reject ASD.
- Hyperfocus, rejection sensitivity, alexithymia, interoception, and burnout: useful adult context, but not formal diagnostic criteria.

Not included as scored diagnostic instruments:

- DIVA-5, ADOS-2, ADI-R, MIGDAS-2, CAARS/CAARS-2, Conners scales, and formal neuropsychological measures. These are clinician-administered, licensed, observational, informant-based, or copyrighted tools and should be used by qualified professionals rather than copied into this app.
- Direct copies of AQ, RAADS-R, RAADS-14, CAT-Q, RBQ-2A/RBQ-3, ESQ-R, ASRS, or any other instrument. This app uses original wording to organize discussion, not to reproduce those tests.

## Child And Teen Version

The current app is an adult self-report tool. A child or teen pathway should be separate rather than mixed into the adult scoring.

- Under age 6: use a developmental/autism-focused pathway with parent/caregiver report and clinical referral prompts. ADHD diagnosis is usually handled cautiously at this age.
- Ages 6-11: use a child pathway with parent/caregiver and teacher/informant forms. The child can contribute examples, but adult-style self-report should not be the main evidence.
- Ages 12-17: use a teen pathway with teen self-report plus parent/caregiver and teacher/informant forms.
- Ages 18+: use the current adult pathway, with optional collateral history for childhood onset.

Young DIVA-5 and Conners 4-style constructs are relevant for youth, but they should be implemented as original, age-appropriate, multi-informant prompts rather than copied from those instruments.

## Report Output

The generated report includes:

- Overall screening-match percentages for ADHD, autism spectrum, AuDHD pattern, legacy Asperger's-style profile, OCD, CDS, and anxiety.
- AuDHD interaction detection: specific masking, mimicking, and amplifying patterns between ADHD and autism-spectrum domains are surfaced when both conditions show co-occurring signal.
- ADHD presentation discussion, including inattentive, hyperactive/impulsive, and combined-style patterns.
- ADHD adult impact discussion, including work/education, relationships, daily living, emotional lability, self-concept, and attention variability.
- Autism-spectrum domain breakdown and support-level discussion.
- Autism developmental-context notes, including early social, restricted/repetitive or sensory, requesting, joint-attention/showing, language markers, and regression/collateral prompts.
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
- The first missing question is highlighted and focused when report generation is attempted too early; answering each highlighted missing question advances to the next missing question.

## Development

This project is intentionally dependency-free:

- `index.html` contains the document structure and source links.
- `styles.css` contains responsive layout and print styles.
- `questions.js` contains the live question bank, answer-choice definitions, display chunk size, and condition labels.
- `script.js` contains mixed question display, scoring, rendering, persistence, validation, PDF generation, and event handlers.
- `questions.md` contains candidate construct-mapping notes for future question-bank review. It is a reference file, not a copied licensed instrument.
- `tasks.md` contains the accuracy and coverage backlog, including completed work, pending work, and suggested implementation order.

Useful checks:

```powershell
node --check questions.js
node --check script.js
(Select-String -Path questions.js -Pattern 'q\("').Count
```

Core clinical framing references are linked in the app's Sources section. Additional construct names in this README are included to explain design intent and should be checked against current professional guidance before clinical use.
