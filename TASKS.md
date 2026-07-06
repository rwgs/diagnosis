# Tasks — Accuracy and Coverage Backlog

Pending work to improve screening accuracy. Organised by purpose, then by priority within each section. None of the wording below is copied from a named or licensed instrument; constructs are described using original phrasing.

Top-level groupings:

1. **Core trait accuracy** — improvements specifically for ADHD, autism, AuDHD, and CDS scoring.
2. **Differential and adjacent conditions** — improvements that reduce cross-misdiagnosis with conditions outside the core four.
3. **Lower-priority improvements** — report-rendering and framing refinements.
4. **Engineering, accessibility, and report quality** — code-review findings (2026-07-06) covering report wording, accessibility, testing, and code structure. No new questions.

---

## Status

| Section | Status |
|---|---|
| 1. Core trait accuracy — Tier 1A (response-bias controls) | **Done** |
| 1. Core trait accuracy — Tier 1B (trait stability) | **Done** |
| 1. Core trait accuracy — Tier 2 (boundary discrimination) | **Done** |
| 1. Core trait accuracy — Tier 3 (AFAB / masked autism) | **Done** |
| 2. Differential — PTSD / complex PTSD (Tier 1) | **Done** |
| 2. Differential — remaining (BPD, IAD, hoarding, smaller adjacents) | Pending |
| 3. Lower-priority improvements | Pending |
| 4. Engineering — scoring split + test harness (Tier 1) | **Done** |
| 4. Engineering — remaining (safety wording, accessibility, report/UX, polish) | Pending |

Question count: 222 (Section 1 work + PTSD cluster).

---

## 1. Core trait accuracy (ADHD / ASD / AuDHD / CDS) — DONE

### Tier 1A — Response-bias controls — DONE

**Implemented items** (`condition: "validity"`, do not feed condition percentages):
- `val-reverse-inatt` — reverse-scored multi-step-plan tracking (paired with the `inattention` domain)
- `val-reverse-social` — reverse-scored nonverbal-cue reading (paired with the `nonverbalCommunication` domain)
- `val-reverse-emotion` — reverse-scored return-to-calm (paired with the `emotionalControl` domain)
- `val-infrequency` — "never felt distracted in life" Yes/Unsure/No implausibility probe
- `val-consist-objects` — consistency pair for losing daily objects (paired with `adhd-i7`)
- `val-consist-mentalize` — consistency pair for reading thoughts/feelings (paired with `asd-c13`)

**Scoring layer:** `computeValidityFlags()` in `script.js` runs after condition scoring, produces a separate `validityFlags` array attached to the report. Discordant pairs (both reverse and forward high, or both low) trigger a flag. The infrequency probe flags direct endorsement of the implausible statement. Renderer adds a "Response Quality Notes" section to HTML and PDF only when flags fire. No symptom percentages are modified.

### Tier 1B — Trait stability / lifetime persistence — DONE

**Implemented items** (`condition: "context"`):
- `ctx-lifetime-continuity` — pattern continuous across most of adult life
- `ctx-symptom-free-intervals` — stretches of a year or more when difficulties were not present (acts as inverse marker)

**Scoring layer:** `context.traitStability` computed as `(lifetimeContinuity + (100 - symptomFreeIntervals)) / 2`. Added to ADHD `gate` and ASD `gate` formulas at weight 0.10; other gate weights rebalanced to keep sums at 1.00.

### Tier 2 — Boundary discrimination — DONE

**Implemented items** (new `Pattern Clarification` section, `condition: "discriminator"`, forced-choice four-option format):
- `disc-drift` — attention-drift quality (ADHD-PI vs. CDS)
- `disc-interest` — interest duration (ADHD enthusiasms vs. autistic special interests)
- `disc-rigidity` — rigidity aetiology (autistic sameness vs. ADHD-compensatory rigidity)
- `disc-stim` — repetitive-movement function (autistic stim vs. ADHD fidget)

**New `CHOICES` types:** `attentionDrift`, `interestDuration`, `rigidityAetiology`, `stimFunction`. Each has four labeled options including "Both equally" (split contribution to both conditions, supports AuDHD signal) and "Neither fits" (no adjustment).

**Scoring layer:** New helpers `readDiscriminator`, `discriminatorContribution`, `adhdDiscriminatorBonus`, `asdDiscriminatorBonus`, `cdsDiscriminatorBonus`. Bonuses applied at final-percent stage. Maximum total adjustment: ADHD ±9, ASD ±6, CDS ±5. Adjustments are surfaced in condition notes.

### Tier 3 — AFAB / masked autism presentation — DONE

**Implemented items** (`condition: "asd"`):
- `afab-interest-content` (new domain `interestContent`, added to ASD `extendedDomains`)
- `afab-mimicry` (existing `camouflageAssimilation` domain)
- `afab-late-recognition` (existing `aspergerProfile` domain)

---

## 2. Differential and adjacent conditions — IN PROGRESS

These reduce **cross-misdiagnosis** rather than improving core-trait scoring. Each addresses a common misclassification vector.

### Tier 1 — PTSD / complex PTSD — DONE

**Why it matters:** PTSD mimics ADHD (hyperarousal/hypervigilance), autism (withdrawal, dissociation), and CDS (numbing, derealisation). cPTSD particularly mimics autism and borderline patterns. Previously only `diff-trauma` flagged it as one screener item.

**Implemented items** (`condition: "differential"`, domain `ptsdComplex`, `scale` type, one per DSM-5 cluster):
- `diff-ptsd-intrusion` — intrusion / re-experiencing (unwanted memories, flashbacks, reliving)
- `diff-ptsd-avoidance` — avoidance of trauma-linked people/places/thoughts/feelings
- `diff-ptsd-cognition` — negative cognition/mood (shame, guilt, blame, bleak outlook, anhedonia)
- `diff-ptsd-arousal` — arousal/reactivity (hypervigilance, startle, irritability, recklessness)
- `diff-ptsd-dissociation` — dissociation/derealisation (unreality, detachment, lost time)

**Scoring layer:** The five items share the `ptsdComplex` differential domain, averaged by `domainStats` into a single "PTSD/complex PTSD" screen in `scoreDifferential`. It raises a differential flag at ≥50% like the other differential domains (no core-condition weights changed). `buildRecommendations` adds a specific recommendation at ≥50%: "Consider a PTSD or complex-PTSD differential alongside the ADHD and autism review; trauma responses can mimic ADHD hyperarousal, autistic withdrawal or dissociation, and CDS-style numbing." The pre-existing broad `diff-trauma` item (domain `trauma`) is retained. `tests.js` section 4c asserts the domain scoring and flag boundaries; the golden baseline and question count were refreshed to 222.

---

### Tier 1 — Borderline / emotional dysregulation differential

**Why it matters:** Largest single source of cross-misdiagnosis with ADHD in adults, especially AFAB. ADHD emotional lability and rejection sensitivity overlap heavily with BPD affective instability and abandonment sensitivity — and the current report cannot tell them apart.

**Discriminators to probe (original wording):**

- Identity instability: *"My sense of who I am shifts substantially depending on who I am with, recent feedback, or life events."* (BPD-specific; ADHD self-concept is stable-negative)
- Idealisation–devaluation: *"My view of important people can swing between very positive and very negative within hours or days, depending on how an interaction went."*
- Chronic emptiness vs. understimulation: *"I have long stretches of feeling empty or hollow inside, which is different from feeling under-stimulated or bored."*
- Fear of abandonment as primary driver: *"Anticipated or perceived rejection by an important person produces a level of distress that organises a lot of my behaviour."*

**Scoring integration:** New `differential` domain `borderlinePattern`. When elevated alongside ADHD emotional-dysregulation domains, surface a "consider BPD differential" note.

---

### Tier 2 — Illness anxiety disorder vs. health-OCD

**Why it matters:** DSM-5 separated illness anxiety disorder (IAD) from OCD-flavored health concerns. Different treatment pathways.

**One discriminator item:**
- *"My health-related worry focuses mainly on the possibility of having a serious disease itself, rather than on contamination, on doing rituals, or on neutralising a feared outcome."*

**Scoring integration:** If `ocd-theme-health` is elevated and this item endorses the IAD direction, surface "consider illness anxiety disorder differential."

---

### Tier 2 — Hoarding disorder vs. OCD hoarding theme

**Why it matters:** DSM-5 split. Different epidemiology, onset, treatment, insight.

**One discriminator item:**
- *"Difficulty discarding things comes mainly from genuine attachment to items or distress at losing them — rather than from a sense of contamination, exactness, or avoiding a feared consequence."*

**Scoring integration:** If `ocd-theme-hoard` is elevated and this item endorses the hoarding-disorder direction, surface "consider hoarding disorder differential."

---

### Tier 3 — Smaller adjacents

| Construct | Items | Purpose |
|---|---|---|
| Misophonia | 1 | Sound-specific intolerance distinct from general sensory sensitivity; relevant ASD/OCD adjacency |
| Tic disorder beyond OCD-tic | 1 | Differentiate Tourette's/persistent tic disorder from OCD-with-tics specifier |
| Body dysmorphic disorder | 1 | OCD-related-disorders chapter; specific to appearance preoccupation |
| Specific phobia | 1 | Currently uncovered |
| Agoraphobia | 1 | `anx-panic2` covers some, but agoraphobia is its own DSM diagnosis |
| Substance specifics | 2 | Split caffeine and cannabis from generic substance flag — both are common ADHD self-medication patterns |
| Perimenopause / hormonal context (AFAB) | 1 | Common timing for adult ADHD/ASD recognition |
| Restless legs / iron deficiency proxy | 1 | Common ADHD comorbidity that mimics hyperactivity |

---

## 3. Lower-priority improvements — PENDING

- **Symptom-count exposure**: surface `inattentive.countOften` and `hyper.countOften` more prominently in the report. DSM-5 uses count thresholds, and percentages can obscure whether the count is met.
- **Peak-intensity per domain**: alongside the average, expose the maximum item score so a domain at 75% average from uniform "Often" answers can be distinguished from one with mixed "Very often" + "Sometimes".
- **Strengths-based items** for autistic and ADHD strengths (deep interests, pattern recognition, justice sensitivity, hyperfocus output). Improves disclosure quality and counterbalances deficit-only framing.
- **Cultural framing audit**: review wording for terms with cultural variation (eye contact, "blunt", "intense", "appropriate") and provide concrete examples where possible.
- **`ctx-developmental-regression` scoring weight**: currently informational-only in clinician notes; reconsider if clinician feedback over time suggests it should carry weight in the ASD gate.

---

## 4. Engineering, accessibility, and report quality — PENDING

Findings from a code review (2026-07-06). These change report wording, accessibility, and code structure; none add questions. Already fixed from the same review: `TASKS.md`/`QUESTIONS.md` were gitignored and untracked (now committed).

### Tier 1 — Safety-item "Prefer not to say" is reported as an endorsement

**Why it matters:** "Prefer not to say" on `diff-risk-self`/`diff-risk-other` scores 3/4 (75%), which correctly triggers the conservative safety flag — but the report then states thoughts "were endorsed at a clinically important level" and lists "Current self-harm risk 75%". That is factually wrong when the respondent declined to answer, and the endorsed-vs-declined distinction is clinically meaningful in a document handed to a clinician.

**Fix:** Keep the conservative flagging. Detect the declined answer via the stored answer label (not the numeric value) in `scoreDifferential`, and adjust wording in `renderResults` and `buildPdfLines` to something like "declined to answer — clinician should ask directly." Render the differential tag as "declined" rather than a percentage.

### Tier 1 — Radio groups are not programmatically associated with question text

**Why it matters:** Each answer option is a `label` wrapping a radio, but the question text is a sibling `div`. A screen-reader user tabbing into a group hears only the option label ("Never — absent or almost absent, 1 of 5") with no way to know which of the 217 questions the group belongs to.

**Fix:** In `renderQuestionnaire`, give each `.question-row` `role="radiogroup"` and `aria-labelledby` pointing to an id on the question copy (or make each row a per-question `fieldset` with the question as its `legend`). Add this to the AGENTS.md accessibility requirements once implemented.

### Tier 1 — Scoring engine has no tests — DONE

**What was implemented:** The pure scoring core was extracted from `script.js` into a new dependency-free `scoring.js`:

- **Moved to `scoring.js`:** `average`, `weightedAverage`, `clamp`, `domainStats`, `domainAverage`, `choiceDomain`, `completionStats`, `readDiscriminator`, `discriminatorContribution`, `adhd/asd/cdsDiscriminatorBonus`, `computeValidityFlags`, all condition scorers (`scoreAdhd`, `scoreAsd`, `scoreAudhd`, `detectAudhdPatterns`, `scoreOcd`, `scoreCds`, `scoreAnxiety`, `scoreDifferential`), and the threshold/label helpers `level`, `gateLabel`, `insightLabel`, `supportLevelLabel`, `ocdSummary`, `asdSupportProfile`.
- **New pure entry points:** `buildContext(questions, answers)` and `buildReport(data, questions)`, extracted from the old `scoreAssessment`. `script.js`'s `scoreAssessment()` is now a thin DOM wrapper that reads the form via `getAnswers()`/`allQuestions()` and calls `buildReport()`.
- **`WEIGHTS` constant:** every gate, final-percent, coverage, and support-level weight vector is now a named entry in a single `WEIGHTS` object that the scorers read from — one source of truth instead of scattered literals. `DISCRIMINATOR_CAPS = { adhd: 9, asd: 6, cds: 5 }` documents the bonus bounds.
- **Dual export:** `scoring.js` loads as a classic `<script>` before `script.js` in `index.html` (top-level functions become browser globals that `script.js` calls), and also `module.exports`es everything for Node.
- **`tests.js` (run `node tests.js`, no dependencies):** asserts every `WEIGHTS` vector sums to 1.00; exhaustively enumerates discriminator answer combinations and checks each condition's bonus stays within its cap (ADHD ±9, ASD ±6, CDS ±5); checks validity-flag firing/quiet at boundaries; checks `level`/`supportLevelLabel`/`gateLabel`/`insightLabel` and ADHD-presentation thresholds; and locks a full-report golden baseline over the whole 217-item bank. The refactor was verified byte-for-byte against the pre-split implementation over the full bank before landing.

Section 2 scoring changes can now proceed: keep new logic in `scoring.js` and extend `tests.js` alongside it.

### Tier 2 — Report and UX corrections

- **AuDHD interaction tags render as fake percentages**: `scoreAudhd` emits "Masking/Mimicking/Amplifying interactions" as 100%/0% domain tags next to genuine scale scores; a clinician could read 100% as severity. Render as detected/not detected instead.
- **Question mixing degrades at the end**: the round-robin interleave in `displayQuestionGroups` exhausts short sections early; the final ~25 questions alternate between only the two longest sections and the last few are consecutive same-condition items, undermining the mixed-presentation design. Replace with a deterministic fractional-spread interleave (each section's items placed at even intervals across the full sequence).
- **UTC date bug**: `new Date().toISOString().slice(0, 10)` produces the UTC date, which is wrong for UK users on BST evenings and anyone east of UTC. Use a local-date formatter (three call sites: default report date, results header, PDF export filename).
- **localStorage schema guard**: `restoreAnswers` silently drops stale answers if question IDs or choice values change. Store a question-bank version or question count alongside answers and tell the user when a partial restore happened.

### Tier 3 — Minor polish

- **PDF pagination**: keep subheadings with their following line so a heading is not orphaned at the bottom of a page; `spacingBefore` is consumed before the page-break check in `paginatePdfLines`.
- **Dead code**: `rawValue` returned from `scoreAssessment` is never used.
- **Shared-computer privacy note**: add one sentence to "Before You Start" warning that answers persist in this browser on shared or public computers.
- **Doc filename case**: README.md and AGENTS.md reference `questions.md`/`tasks.md`; the actual files are `QUESTIONS.md`/`TASKS.md`.

---

## Suggested implementation order for remaining work

- ~~**Scoring split and test harness** (Tier 1, Section 4)~~ — **Done.** `scoring.js` + `tests.js` are in place; scoring-formula changes below are now regression-testable.
- ~~**PTSD cluster** (Tier 1, Section 2)~~ — **Done.** Five-cluster `ptsdComplex` differential domain + recommendation; see Section 2 above.

1. **Safety-item "Prefer not to say" wording** (Tier 1, Section 4) — small change, clinically important reporting accuracy.
2. **Radio-group labeling** (Tier 1, Section 4) — small change, largest accessibility gap.
3. **BPD discrimination** (Tier 1, Section 2) — biggest cross-misdiagnosis vector with ADHD emotional dysregulation.
4. **IAD and hoarding-disorder discriminators** (Tier 2, Section 2) — single-item additions with high clinical specificity.
5. **Report and UX corrections** (Tier 2, Section 4) — AuDHD tag rendering, interleave fix, local-date fix, storage guard.
6. **Smaller adjacents** (Tier 3, Section 2) — when relevant feedback or use justifies the additional item burden.
7. **Lower-priority improvements** (Section 3 and Tier 3, Section 4) — symptom-count surfacing, peak-intensity reporting, and minor polish; report-rendering changes without new questions.

---

## Notes for implementers

- All wording above is original. When implementing, keep the app's existing pattern of original construct mapping rather than reproducing items from any named instrument.
- Each new item adds to the required-question total; update `README.md` question count in the same change.
- Validity-layer items (now implemented) flag careless responding without modifying symptom percentages. Future additions to that layer should keep the same separation of meta-validity from symptom signal.
- For boundary-discrimination items (now implemented), the four `discriminator` choice types in `questions.js` (`attentionDrift`, `interestDuration`, `rigidityAetiology`, `stimFunction`) can be re-used as a template if further pairwise discriminators are added.
- After any scoring-formula change, verify weights still sum to 1.00 in each condition. This is now automated: weights live in the `WEIGHTS` object in `scoring.js` and `tests.js` asserts each vector sums to 1.00, so run `node tests.js` rather than checking by hand. If a scoring change is intentional, update the golden baseline in `tests.js` in the same commit.
