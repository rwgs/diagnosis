# Tasks — Accuracy and Coverage Backlog

Pending work to improve screening accuracy. Organised by purpose, then by priority within each section. None of the wording below is copied from a named or licensed instrument; constructs are described using original phrasing.

Top-level groupings:

1. **Core trait accuracy** — improvements specifically for ADHD, autism, AuDHD, and CDS scoring.
2. **Differential and adjacent conditions** — improvements that reduce cross-misdiagnosis with conditions outside the core four.
3. **Lower-priority improvements** — report-rendering and framing refinements.
4. **Engineering, accessibility, and report quality** — code-review findings (2026-07-06) covering report wording, accessibility, testing, and code structure. No new questions.
5. **Second review pass** — findings from a follow-up code review (2026-07-06, after Section 4 landed) covering the guided missing-answer flow, localStorage restore-guard gaps, scoring hygiene, test coverage, and polish. No new questions.

---

## Status

| Section | Status |
|---|---|
| 1. Core trait accuracy — Tier 1A (response-bias controls) | **Done** |
| 1. Core trait accuracy — Tier 1B (trait stability) | **Done** |
| 1. Core trait accuracy — Tier 2 (boundary discrimination) | **Done** |
| 1. Core trait accuracy — Tier 3 (AFAB / masked autism) | **Done** |
| 2. Differential — PTSD / complex PTSD (Tier 1) | **Done** |
| 2. Differential — Borderline / emotional dysregulation (Tier 1) | **Done** |
| 2. Differential — IAD & hoarding-disorder discriminators (Tier 2) | **Done** |
| 2. Differential — remaining (Tier 3 smaller adjacents) | Pending |
| 3. Lower-priority improvements | In progress (symptom-count + peak-intensity done) |
| 4. Engineering — scoring split + test harness (Tier 1) | **Done** |
| 4. Engineering — safety-item "Prefer not to say" wording (Tier 1) | **Done** |
| 4. Engineering — radio-group labeling (Tier 1) | **Done** |
| 4. Engineering — report/UX corrections (Tier 2) | **Done** |
| 4. Engineering — minor polish (Tier 3) | **Done** |
| 5. Second review — missing-answer flow + restore guard (Tier 1) | **Done** |
| 5. Second review — scoring hygiene + test coverage (Tier 2) | **Done** |
| 5. Second review — minor polish (Tier 3) | **Done** |

Question count: 228 (Section 1 work + PTSD cluster + BPD discriminators + IAD/hoarding discriminators).

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

**Scoring layer:** `computeValidityFlags()` in `scoring.js` (originally in `script.js`, moved in the Section 4 engineering split) runs after condition scoring, produces a separate `validityFlags` array attached to the report. Discordant pairs (both reverse and forward high, or both low) trigger a flag. The infrequency probe flags direct endorsement of the implausible statement. Renderer adds a "Response Quality Notes" section to HTML and PDF only when flags fire. No symptom percentages are modified.

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

**Scoring note (2026-07-06 review):** `extendedDomains` in `scoreAsd` is the *display* list, not the scored list. Of these three items, only `afab-mimicry` feeds the ASD percent (through the camouflaging composite inside `extendedAverage`); `interestContent` is display-only and `aspergerProfile` feeds the separate legacy-profile output, not the ASD percent. Whether the two non-scoring domains should carry weight — given this tier's stated false-negative-reduction purpose — was decided in Section 5 Tier 2 (2026-07-07): keep them display-only. Rationale recorded there.

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

### Tier 1 — Borderline / emotional dysregulation differential — DONE

**Why it matters:** Largest single source of cross-misdiagnosis with ADHD in adults, especially AFAB. ADHD emotional lability and rejection sensitivity overlap heavily with BPD affective instability and abandonment sensitivity — and the report previously could not tell them apart.

**Implemented items** (`condition: "differential"`, domain `borderlinePattern`, `scale` type):
- `diff-bpd-identity` — identity instability ("My sense of who I am shifts substantially depending on who I am with, recent feedback, or life events."); BPD-specific, whereas ADHD self-concept is stable-negative
- `diff-bpd-splitting` — idealisation–devaluation ("My view of important people can swing between very positive and very negative within hours or days…")
- `diff-bpd-emptiness` — chronic emptiness distinguished from understimulation/boredom ("I have long stretches of feeling empty or hollow inside, which is different from feeling under-stimulated or bored.")
- `diff-bpd-abandonment` — fear of abandonment as a primary driver ("Anticipated or perceived rejection by an important person produces a level of distress that organises a lot of my behaviour.")

**Scoring layer:** The four items share the `borderlinePattern` differential domain, averaged into a "Borderline / emotional dysregulation" screen in `scoreDifferential` that raises a differential flag at ≥50% (no core-condition weights changed). The clinically meaningful discriminator is co-elevation: `buildRecommendations` surfaces a "consider BPD differential" recommendation only when the borderline domain is ≥50% **and** an ADHD emotional-dysregulation domain (emotional lability, rejection sensitivity, or emotional control) is also ≥50% — pointing the clinician to identity stability, idealisation–devaluation swings, and chronic emptiness to separate BPD from ADHD. `tests.js` section 4d asserts the domain scoring/flag boundaries; the golden baseline and question count were refreshed to 226.

---

### Tier 2 — Illness anxiety disorder vs. health-OCD — DONE

**Why it matters:** DSM-5 separated illness anxiety disorder (IAD) from OCD-flavored health concerns. Different treatment pathways.

**Implemented item** (`condition: "differential"`, domain `iadDirection`, `choice`/`yesNoUnsure`):
- `diff-iad-direction` — *"My health-related worry focuses mainly on the possibility of having a serious disease itself, rather than on contamination, on doing rituals, or on neutralising a feared outcome."* (Yes = IAD direction)

**Scoring layer:** `scoreDifferential` reads this as `directions.iad` (via `choiceDomain`; not a flagging domain). `buildRecommendations` surfaces "consider illness anxiety disorder differential" only when the OCD `themeHealth` screen ("Health/somatic reassurance") is ≥50% **and** `directions.iad` endorses the IAD direction (≥0.75). Tested in `tests.js` section 4e (direction values + no self-flagging).

---

### Tier 2 — Hoarding disorder vs. OCD hoarding theme — DONE

**Why it matters:** DSM-5 split. Different epidemiology, onset, treatment, insight.

**Implemented item** (`condition: "differential"`, domain `hoardingDirection`, `choice`/`yesNoUnsure`):
- `diff-hoard-direction` — *"Difficulty discarding things comes mainly from genuine attachment to items or distress at losing them, rather than from a sense of contamination, exactness, or avoiding a feared consequence."* (Yes = hoarding-disorder direction)

**Scoring layer:** `scoreDifferential` reads this as `directions.hoarding` (via `choiceDomain`; not a flagging domain). `buildRecommendations` surfaces "consider hoarding disorder differential" only when the OCD `themeHoarding` screen ("Hoarding-like difficulty discarding") is ≥50% **and** `directions.hoarding` endorses the hoarding-disorder direction (≥0.75). Tested in `tests.js` section 4e.

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

## 3. Lower-priority improvements — IN PROGRESS

- **Symptom-count exposure** — DONE. `scoreAdhd` now returns a structured `symptomCounts` object `{ inattentiveOften, hyperOften, perDomain: 9, adultThreshold: 5 }` instead of burying the counts in note text. `script.js` renders a shared `symptomCountText(condition)` line prominently in the ADHD detail card (a bold "Symptom count:" line directly under the screening match) and in the PDF ADHD detail, framed as a count for discussion against the ~5-of-9 adult threshold, not a diagnosis. The old free-text count note was removed to avoid duplication. `tests.js` section 4h asserts the count values and that the note was removed.
- **Peak-intensity per domain** — DONE. `domainStats` now returns `peak` (the highest single-item score in the domain, as a percent) alongside `average`/`percent`. `domainValueText` in `script.js` renders `"<avg>% (peak <peak>%)"` in both the HTML and PDF domain tags, but only when the peak sits above the rounded average (a flat domain stays a single number). `tests.js` section 4h covers mixed/flat/empty domains.
- **Strengths-based items** for autistic and ADHD strengths (deep interests, pattern recognition, justice sensitivity, hyperfocus output). Improves disclosure quality and counterbalances deficit-only framing. *(Adds new questions.)*
- **Cultural framing audit**: review wording for terms with cultural variation (eye contact, "blunt", "intense", "appropriate") and provide concrete examples where possible.
- **`ctx-developmental-regression` scoring weight**: currently informational-only in clinician notes; reconsider if clinician feedback over time suggests it should carry weight in the ASD gate.

---

## 4. Engineering, accessibility, and report quality — DONE

Findings from a code review (2026-07-06). These change report wording, accessibility, and code structure; none add questions. Already fixed from the same review: `TASKS.md`/`QUESTIONS.md` were gitignored and untracked (now committed). All tiers below are complete.

### Tier 1 — Safety-item "Prefer not to say" is reported as an endorsement — DONE

**Why it matters:** "Prefer not to say" on `diff-risk-self`/`diff-risk-other` scores 3/4 (75%), which correctly triggers the conservative safety flag — but the report then stated thoughts "were endorsed at a clinically important level" and listed "Current self-harm risk 75%". That is factually wrong when the respondent declined to answer, and the endorsed-vs-declined distinction is clinically meaningful in a document handed to a clinician.

**What was implemented:** The conservative flagging is unchanged (a decline still trips the safety flag). `scoreDifferential` now detects a declined answer by the stored answer **label** (`"Prefer not to say"`), not the numeric value: it marks `riskSelf.declined` / `riskOther.declined`, renders those flags as `"Current self-harm risk (declined to answer)"` instead of a percentage, and returns a `safety` object `{ percent, endorsed, declined, note }`. The `note` distinguishes three cases — endorsed only, declined only ("This is not an endorsement of risk, but a clinician should ask about self-harm and harm-to-others directly"), and both. `renderResults` and `buildPdfLines` render `differential.safety.note` instead of the hardcoded endorsement sentence. `tests.js` section 4f covers all four combinations (declined / endorsed / both / neither) and the declined flag text.

### Tier 1 — Radio groups are not programmatically associated with question text — DONE

**Why it mattered:** Each answer option is a `label` wrapping a radio, but the question text is a sibling `div`. A screen-reader user tabbing into a group heard only the option label ("Never — absent or almost absent, 1 of 5") with no way to know which question the group belonged to.

**What was implemented:** `renderQuestionnaire` now assigns stable ids to each row's question code, copy, and help spans (`${question.id}-code|-copy|-help`) and sets `role="radiogroup"`, `aria-labelledby="<codeId> <copyId>"`, and `aria-describedby="<helpId>"` on the `.question-row`. A screen reader entering an answer group now announces the question number and text as the group name and the answer guidance as its description. The requirement was added to the AGENTS.md accessibility section.

### Tier 1 — Scoring engine has no tests — DONE

**What was implemented:** The pure scoring core was extracted from `script.js` into a new dependency-free `scoring.js`:

- **Moved to `scoring.js`:** `average`, `weightedAverage`, `clamp`, `domainStats`, `domainAverage`, `choiceDomain`, `completionStats`, `readDiscriminator`, `discriminatorContribution`, `adhd/asd/cdsDiscriminatorBonus`, `computeValidityFlags`, all condition scorers (`scoreAdhd`, `scoreAsd`, `scoreAudhd`, `detectAudhdPatterns`, `scoreOcd`, `scoreCds`, `scoreAnxiety`, `scoreDifferential`), and the threshold/label helpers `level`, `gateLabel`, `insightLabel`, `supportLevelLabel`, `ocdSummary`, `asdSupportProfile`.
- **New pure entry points:** `buildContext(questions, answers)` and `buildReport(data, questions)`, extracted from the old `scoreAssessment`. `script.js`'s `scoreAssessment()` is now a thin DOM wrapper that reads the form via `getAnswers()`/`allQuestions()` and calls `buildReport()`.
- **`WEIGHTS` constant:** every gate, final-percent, coverage, and support-level weight vector is now a named entry in a single `WEIGHTS` object that the scorers read from — one source of truth instead of scattered literals. `DISCRIMINATOR_CAPS = { adhd: 9, asd: 6, cds: 5 }` documents the bonus bounds.
- **Dual export:** `scoring.js` loads as a classic `<script>` before `script.js` in `index.html` (top-level functions become browser globals that `script.js` calls), and also `module.exports`es everything for Node.
- **`tests.js` (run `node tests.js`, no dependencies):** asserts every `WEIGHTS` vector sums to 1.00; exhaustively enumerates discriminator answer combinations and checks each condition's bonus stays within its cap (ADHD ±9, ASD ±6, CDS ±5); checks validity-flag firing/quiet at boundaries; checks `level`/`supportLevelLabel`/`gateLabel`/`insightLabel` and ADHD-presentation thresholds; and locks a full-report golden baseline over the whole 217-item bank. The refactor was verified byte-for-byte against the pre-split implementation over the full bank before landing.

Section 2 scoring changes can now proceed: keep new logic in `scoring.js` and extend `tests.js` alongside it.

### Tier 2 — Report and UX corrections — DONE

- **AuDHD interaction tags rendered as fake percentages** — DONE. `scoreAudhd` now emits the three interaction domains as `{ detected: boolean }` instead of `{ percent: 100|0 }`. A shared `domainValueText(stats)` helper in `script.js` renders a domain as `detected`/`not detected` when it carries a boolean `detected` field and as a rounded percentage otherwise; both the HTML `detailCard` and the PDF `buildPdfLines` domain loops use it. `tests.js` section 4g locks the detection-flag shape (masking trigger → `detected:true` with no `percent`, empty domains → all `detected:false`, genuine ADHD/Autism siblings keep `percent`).
- **Question mixing degraded at the end** — DONE. `displayQuestionGroups` replaces the round-robin with a deterministic fractional-spread interleave: each item is keyed by `(itemIndex + 0.5) / sectionCount` and the full set is sorted by that key (ties broken by section then item order). Verified over the live 228-item bank: all items preserved, no two adjacent questions share a section, and the final 25 questions now span 15 sections instead of clumping into the two longest.
- **UTC date bug** — DONE. New `localDateString()` helper formats the local calendar date as `YYYY-MM-DD`; it replaced `new Date().toISOString().slice(0, 10)` at all four call sites (results header, PDF filename, PDF header, and the default report-date field initializer).
- **localStorage schema guard** — DONE. `saveAnswers` now writes a `meta` object `{ version: STORAGE_VERSION, questionCount }` alongside answers. `restoreAnswers` counts how many stored answers still map to a current question/choice; when any were dropped (id removed/renamed or choice value changed) or the stored `meta.version` differs from `STORAGE_VERSION`, it reports "Restored N of M saved answers…" instead of silently restoring a partial set. `STORAGE_VERSION` is bumped when a bank change invalidates saved answers.

### Tier 3 — Minor polish — DONE

- **PDF pagination** — DONE. `paginatePdfLines` now includes `spacingBefore` in the page-break decision (rather than consuming it first and only then checking) and honours a `keepWithNext` flag: `addPdfSubheading` sets `keepWithNext: true`, which `addWrappedPdfText` propagates onto each emitted line, so a subheading requires room for both itself and the following line and breaks to the next page with its content instead of being orphaned at the foot of a page. Verified in isolation against the page-bottom edge case (heading that previously orphaned now moves with its content).
- **Dead code** — DONE. Removed the unused `rawValue: value` field from `buildReport`'s return and the now-orphaned `const value = …` helper in `scoring.js`.
- **Shared-computer privacy note** — DONE. Added a sentence to "Before You Start" in `index.html`: answers are saved only in this browser on this device, others sharing the browser could see or restore them, so clear answers when finished.
- **Doc filename case** — DONE. `AGENTS.md` now references `QUESTIONS.md`/`TASKS.md` (README.md already used the correct case).

---

## 5. Second review pass (2026-07-06) — DONE

Findings from a follow-up code review after all Section 4 work landed. Verified against the live 228-item bank; none add questions. The scoring math itself was checked and confirmed correct (all 16 `WEIGHTS` vectors sum to 1.00, discriminator caps hold at their extremes, no orphan or missing domains, all hardcoded ids resolve with correct polarity). All tiers below were implemented on 2026-07-07.

### Tier 1 — Guided missing-answer flow and restore guard — DONE

- **Missing-answer repair flow now walks on-screen order.** `getMissingQuestions()` no longer filters `allQuestions()` (internal section order); it iterates the rendered `.question-row[data-question-id]` elements, which `querySelectorAll` returns in document order — the fractional-spread interleave the user actually sees. "First missing" and the guided advance sequence now move top-to-bottom down the page instead of jumping backward at every section boundary. Callers use only `.id`/`.length`, so the function returns lightweight `{ id }` objects.
- **Stale-version restore message no longer asserts data loss that did not occur.** `restoreAnswers` now has three distinct branches: `dropped > 0` (a saved answer no longer maps — genuine loss, reports "Restored N of M … could not be restored"); all-restored-but-changed (version bump and/or grown bank — reports "Restored all N … the questionnaire has changed … review and answer any remaining"); and clean restore.
- **Legacy payloads without `meta` are treated as stale.** `staleVersion` is now `!data.meta || data.meta.version !== STORAGE_VERSION`, so a pre-`meta` payload (same `STORAGE_KEY`, exists in the wild) no longer reads as current.
- **`meta.questionCount` is now read.** `restoreAnswers` compares it against `allQuestions().length`; when the bank has grown since the save (new questions under an unbumped version), the restore message tells the user the form "now includes questions that were not in your saved set" instead of restoring silently as if complete.

### Tier 2 — Scoring hygiene and test coverage — DONE

- **Dead term removed from the ADHD `symptomBase` formula** (`scoring.js`): `Math.max(inattentive, hyper, (inattentive + hyper) / 2)` is now `Math.max(inattentive.percent, hyper.percent)`. The mean of two values can never exceed their max, so output is byte-identical (golden baseline unchanged); a comment records that either presentation can carry ADHD on its own, which is why the base is the stronger domain.
- **`val-reverse-social` and `val-reverse-emotion` now have boundary tests.** `tests.js` section 3 adds both-high (fires, correct label), just-below-threshold (quiet), and both-low (fires) assertions for each branch, mirroring the existing `val-reverse-inatt` coverage. A wrong domain label or inverted threshold in either branch would now fail the suite (8 new assertions; suite total 2004).
- **AFAB display-only domains: decided to keep display-only.** `interestContent` (interest *content/style*) and `aspergerProfile` (late self-recognition) remain out of the ASD percent, feeding only the display list and the separate legacy-profile output respectively. Rationale: interest *content* and *late recognition* are descriptive/contextual, not severity signals — folding them into the headline percentage would inflate false positives (e.g. a neurotypical adult with people-oriented interests, or anyone recognised late) and risks double-counting against the camouflaging composite (`afab-mimicry`, which already feeds the score). This keeps the tool's screening-not-diagnosis framing and pairs with the same conservative call on `ctx-developmental-regression`. Documented in README's autism-context section; no scoring change.

### Tier 3 — Minor polish — DONE

- **Title promoted to `<h1>`.** The header title was an `<h2>` with no level-1 heading anywhere, so screen-reader heading navigation started at level 2. It is now the page's single `<h1>`, which reactivates the existing (previously dead) `h1` hero rule in `styles.css` and restores a correct heading hierarchy (the other `<h2>` section headings now sit under it). The unused `--violet`/`--violet-soft` CSS variables were removed.
- **PDF export now folds accented Latin letters.** `normalizePdfText` runs `.normalize("NFD")` then strips the U+0300-U+036F combining-diacritical-marks range before the ASCII fallback, so "Jose" keeps its letters (it files as "jose") in the non-embedded Helvetica PDF instead of losing the accented letter to a space. Non-Latin scripts still fall back to spaces (inherent to the built-in font); README updated to describe transliteration rather than plain replacement.
- **Text-field keystroke cost reduced.** The `input` handler now calls a debounced `saveAnswersDebounced()` (400 ms trailing) instead of a full `saveAnswers()` per keystroke, so the ~228-`querySelector` read + progress recompute + JSON serialization runs once the user pauses. The immediate `change`-on-blur save and the pre-generate/export save still guarantee the latest text is persisted; radio changes remain immediate.

---

## Suggested implementation order for remaining work

- ~~**Scoring split and test harness** (Tier 1, Section 4)~~ — **Done.** `scoring.js` + `tests.js` are in place; scoring-formula changes below are now regression-testable.
- ~~**PTSD cluster** (Tier 1, Section 2)~~ — **Done.** Five-cluster `ptsdComplex` differential domain + recommendation; see Section 2 above.
- ~~**BPD discrimination** (Tier 1, Section 2)~~ — **Done.** `borderlinePattern` differential domain + co-elevation recommendation; see Section 2 above.
- ~~**IAD and hoarding-disorder discriminators** (Tier 2, Section 2)~~ — **Done.** `iadDirection`/`hoardingDirection` directional items + theme-gated recommendations; see Section 2 above.

- ~~**Safety-item "Prefer not to say" wording** (Tier 1, Section 4)~~ — **Done.** Declined answers are detected by label and reported as "declined to answer" rather than an endorsement/percentage; see Section 4 above.
- ~~**Radio-group labeling** (Tier 1, Section 4)~~ — **Done.** Each question row is a `radiogroup` labelled by its question code/copy and described by its help text; see Section 4 above.
- ~~**Report and UX corrections** (Tier 2, Section 4)~~ — **Done.** AuDHD detection-flag rendering, fractional-spread interleave, `localDateString()`, and the localStorage schema guard; see Section 4 above.
- ~~**Minor polish** (Tier 3, Section 4)~~ — **Done.** PDF orphan-heading fix, dead-code removal, shared-computer privacy note, and doc filename case; see Section 4 above.

- ~~**Lower-priority reporting: symptom-count surfacing + peak-intensity** (Section 3)~~ — **Done.** `symptomCounts` on the ADHD scorer rendered prominently, and `peak` on every `domainStats` domain rendered next to the average; see Section 3 above.

- ~~**Missing-answer flow + restore guard** (Tier 1, Section 5)~~ — **Done.** `getMissingQuestions()` walks DOM order; restore messaging splits genuine drop from version/grown-bank change; `meta` absence treated as stale; `meta.questionCount` read. See Section 5 above.
- ~~**Scoring hygiene + test coverage** (Tier 2, Section 5)~~ — **Done.** Dead `symptomBase` term removed (output unchanged), `val-reverse-social`/`val-reverse-emotion` boundary tests added, and the AFAB domains decided display-only with recorded rationale. See Section 5 above.
- ~~**Minor polish** (Tier 3, Section 5)~~ — **Done.** Title promoted to `<h1>` (dead `--violet` vars removed), PDF accent-folding, and debounced text-field saves. See Section 5 above.

Remaining backlog (all optional / add questions or need clinical judgment; none are mechanical):

1. **Smaller adjacents** (Tier 3, Section 2) — when relevant feedback or use justifies the additional item burden.
2. **Remaining lower-priority improvements** (Section 3) — strengths-based items (adds questions), cultural-framing audit (wording review), and the `ctx-developmental-regression` weighting question (scoring judgment; note the parallel AFAB call in Section 5 Tier 2 landed on "keep informational").

---

## Notes for implementers

- All wording above is original. When implementing, keep the app's existing pattern of original construct mapping rather than reproducing items from any named instrument.
- Each new item adds to the required-question total; update `README.md` question count in the same change.
- Validity-layer items (now implemented) flag careless responding without modifying symptom percentages. Future additions to that layer should keep the same separation of meta-validity from symptom signal.
- For boundary-discrimination items (now implemented), the four `discriminator` choice types in `questions.js` (`attentionDrift`, `interestDuration`, `rigidityAetiology`, `stimFunction`) can be re-used as a template if further pairwise discriminators are added.
- After any scoring-formula change, verify weights still sum to 1.00 in each condition. This is now automated: weights live in the `WEIGHTS` object in `scoring.js` and `tests.js` asserts each vector sums to 1.00, so run `node tests.js` rather than checking by hand. If a scoring change is intentional, update the golden baseline in `tests.js` in the same commit.
