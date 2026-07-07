# Tasks — Accuracy and Coverage Backlog

Pending work to improve screening accuracy. Organised by purpose, then by priority within each section. None of the wording below is copied from a named or licensed instrument; constructs are described using original phrasing.

Top-level groupings:

1. **Core trait accuracy** — improvements specifically for ADHD, autism, AuDHD, and CDS scoring.
2. **Differential and adjacent conditions** — improvements that reduce cross-misdiagnosis with conditions outside the core four.
3. **Lower-priority improvements** — report-rendering and framing refinements.
4. **Engineering, accessibility, and report quality** — code-review findings (2026-07-06) covering report wording, accessibility, testing, and code structure. No new questions.
5. **Second review pass** — findings from a follow-up code review (2026-07-06, after Section 4 landed) covering the guided missing-answer flow, localStorage restore-guard gaps, scoring hygiene, test coverage, and polish. No new questions.
6. **Third review pass** — findings from a follow-up code review (2026-07-07, after the theme-toggle UI landed) covering storage robustness, recommendation-logic testability, theme-toggle accessibility, and CSS cleanup. No new questions.
7. **Bank-slimming review** — merge/removal shortlist from a redundancy audit of the live 228-item bank (2026-07-07). Reduced respondent burden without losing construct coverage. **Done** — all 10 merges applied (228 → 218).

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
| 2. Differential — remaining (Tier 3 smaller adjacents) | **Deferred** (2026-07-07 decision — see Remaining-item proposal) |
| 3. Lower-priority improvements | **Done** (symptom-count, peak-intensity, cultural-framing audit, and the optional strengths module all landed; only the clinician-feedback-gated `ctx-developmental-regression` weight remains, by design) |
| 4. Engineering — scoring split + test harness (Tier 1) | **Done** |
| 4. Engineering — safety-item "Prefer not to say" wording (Tier 1) | **Done** |
| 4. Engineering — radio-group labeling (Tier 1) | **Done** |
| 4. Engineering — report/UX corrections (Tier 2) | **Done** |
| 4. Engineering — minor polish (Tier 3) | **Done** |
| 5. Second review — missing-answer flow + restore guard (Tier 1) | **Done** |
| 5. Second review — scoring hygiene + test coverage (Tier 2) | **Done** |
| 5. Second review — minor polish (Tier 3) | **Done** |
| 6. Third review — storage guard (Tier 1) | **Done** |
| 6. Third review — recommendations into scoring layer (Tier 2) | **Done** |
| 6. Third review — minor polish (Tier 3) | **Done** |
| 7. Bank slimming — merge shortlist | **Done** (2026-07-07 — all 10 merges applied, 228 → 218) |

Question count: 218 required (228 minus the 10 bank-slimming merges in Section 7; `STORAGE_VERSION` bumped 1 → 2), plus 7 optional, unscored strengths items = 225 total. The optional items do not gate the report or count toward the required total.

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

> **Deferred — 2026-07-07 decision.** The required bank is capped at the current 228 items and these adjacents are not being implemented; see the decision record in the [Remaining-item proposal](#remaining-item-proposal--question-count-ceiling-and-shortlist-2026-07-07-for-review). Rationale: existing flag-level differential coverage already changes what a clinician does with the report; these items sharpen distinctions inside anxiety/OCD territory, which is the assessing clinician's own differential job. Revisit only if clinician or user feedback identifies a specific missed confound. The table below is kept as the original candidate list.

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
- **Strengths-based items** for autistic and ADHD strengths — **DONE (2026-07-07).** Built as form (a): an optional, ungated, unscored section. 7 items (`condition: "strengths"`, `domain: strength*`) in a new `optional: true` section — `str-hyperfocus` (hyperfocus/sustained output), `str-drive` (high drive/energy), `str-ideation` (rapid ideation/creativity), `str-expertise` (deep expertise from focused interests), `str-pattern` (pattern recognition/systemizing), `str-justice` (fairness/honesty/justice sensitivity), `str-detail` (attention to detail). New `strengthDegree` choice scale ("Not like me" → "Very like me"). **Scoring layer:** `buildStrengths(questions, answers)` in `scoring.js` returns items endorsed at ≥3 (Quite/Very like me) as `{ id, label, level }`; `buildReport` attaches it as `report.strengths`, and `completionStats` now counts required-only (`!optional && condition !== "strengths"`). **Render:** `renderSectionNode` renders the section separately after the mixed required flow (numbered "Optional 1…7", `data-optional="true"`); `renderResults`/`buildPdfLines` add a "Reported Strengths" block shown only when at least one is endorsed. **Gating/persistence:** `requiredQuestions()` drives the progress meter, missing-answer flow, and `meta.questionCount`, so optional items never gate a report or trip the restore-grew message; `STORAGE_VERSION` unchanged (no saved answers invalidated). `tests.js` section 4j covers the ≥3 threshold, label fallback, the non-strengths-ignored and no-condition-percent-change invariants, and required-only completion; total = 225 items (218 required + 7 optional), suite at 2056 assertions.
- **Cultural framing audit** — DONE (2026-07-07). Wording-only review; no new questions, no scoring change (golden baseline unchanged, question count still 228). Findings and changes:
  - **Global framing added to the "Before You Start" intro** (`index.html`): a paragraph instructing respondents to judge each trait against the norms of their own culture, community, and family, noting that eye contact, physical closeness, directness, small talk, and emotional expression vary across cultures, and to mark a pattern only if it differs from what is typical in their own background *and* is difficult/effortful/distressing. This sets the frame for every item at once.
  - **`ctx-child-asd-social`**: "unusual eye contact" (norm-relative) → "eye contact that felt uncomfortable or effortful for me (beyond my culture's or family's norms)"; "unusual tone" → "a tone of voice others found hard to read". Shifts from an external norm judgment to the respondent's own difficulty/effort.
  - **`asd-p3`**: prefixed with "Within my own culture and community, …" so the culturally-variable descriptors (blunt, formal, monotone, too intense, too quiet) are judged against the respondent's own environment rather than an outside group's norms.
  - **`asd-a2`**: "People tell me …" → "People around me tell me …", localizing the reference group to those who share the respondent's norms.
  - **Reviewed and deliberately left unchanged:** `asd-a5`/`asd-a6`/`asd-c9` already frame eye contact around the respondent's own intent, energy cost, or masking effort (not amount of eye contact), so they do not carry the cultural-norm assumption; `adir-tool1` uses eye contact only to describe a contrasting typical joint-attention behaviour; `ctx-literal` uses "normal/appropriate" self-referentially (as examples of vague words) and is fine as written.
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

## 6. Third review pass (2026-07-07) — DONE

Findings from a follow-up code review after the theme-toggle UI landed (commit `e434706`). Health checks at review time: `node --check` clean on all three JS files, the 2004-assertion suite passes, question count (228) consistent across `questions.js`, `README.md`, and this file. None of these added questions. All tiers below were implemented on 2026-07-07 (suite now 2036 assertions).

### Tier 1 — Blocked-storage browsers brick the app — DONE

**Why it mattered:** The theme layer wrapped every `localStorage` access in try/catch, but the answers layer did not. In a browser where site data is blocked (Safari "Block all cookies", Chrome's blocked-site-data setting), any `localStorage` access throws a `SecurityError`. `init()` then died inside `restoreAnswers()` **before any event listeners attached** — every button dead and the page silently non-functional.

**What was implemented (`script.js`):** Three guarded wrappers — `storageGetItem`/`storageSetItem`/`storageRemoveItem` — each in the same try/catch pattern the theme layer already used, plus a module-level `storageAvailable` flag they flip to `false` on the first failure and a shared `STORAGE_BLOCKED_MESSAGE`. All four raw `localStorage` call sites now route through them: `restoreAnswers` (get, and remove in its catch), `saveAnswers` (set), and the Clear Answers handler (remove). `saveAnswers` reports the blocked message via `saveState` instead of "Saved locally…" when the write fails; `restoreAnswers` surfaces the same message when the initial read fails; the reset handler shows it in place of "Answers cleared." The theme layer (`storedTheme`, the toggle click handler) was consolidated onto the same wrappers to drop its duplicate try/catch. Because the wrappers no longer throw, generate/export/print (and the guided missing-answer advance that runs after the in-handler save) all work with storage unavailable.

### Tier 2 — `buildRecommendations` moved into the scoring layer — DONE

**Why it mattered:** `buildRecommendations(report)` in `script.js` generated the clinical discussion points rendered in both the HTML report and the PDF. As a pure function of the report it belonged in `scoring.js` under the "keep scoring logic testable" rule, none of its trigger thresholds were covered, and it read `scoring.js` domain-label strings unguarded — a rename in `scoring.js` would pass `node tests.js` yet throw at render time. The same unguarded label reads backed the priority-differential note in `renderResults` and `buildPdfLines`.

**What was implemented:** `buildRecommendations(report, conditionLabels)` moved into `scoring.js`; `buildReport(data, questions, conditionLabels)` now attaches its output as `report.recommendations`. The mania/psychosis priority check is precomputed once in `scoreDifferential` as `differential.priorityFlag` (a boolean), and both the recommendation logic and the render layer (`renderResults`, `buildPdfLines`) read that flag instead of the label strings — removing the label coupling from `script.js` entirely. All domain-label reads inside `buildRecommendations` were guarded (`?.percent ?? 0`) so a future rename degrades to "not elevated" rather than throwing. `script.js`'s `scoreAssessment()` passes `conditionLabels` through, and both render paths now consume `report.recommendations` instead of recomputing. `tests.js` section 4i covers every trigger at its boundary (≥60 formal-assessment with label mapping and descending sort, 55/55 ADHD+ASD pairing, literal/masking ≥50, differential-flags line, `priorityFlag`, PTSD ≥50 incl. the guarded missing-domain case, the BPD co-elevation gate via each ADHD emotion domain, the IAD/hoarding direction gates at ≥0.75, the CDS ≥50 note, and the all-low fallback); the golden baseline now also locks the recommendation count, the `conditionLabels`-mapped first entry, and `priorityFlag`.

### Tier 3 — Minor polish — DONE

- **Theme toggle no longer announces a contradictory state.** `applyTheme` no longer flips the accessible name; the button carries a fixed `aria-label="Dark theme"` (set in `index.html`) with `aria-pressed` carrying the on/off state, so a screen reader announces "Dark theme, pressed" in dark mode instead of the previous "Switch to light theme, pressed". The visible text/icon still flip to show what a click will do.
- **Dead CSS tokens removed.** `--green` and `--amber` (the bare, non-`-soft` tokens) were deleted from both palettes in `styles.css`; the used `--green-soft`/`--amber-soft` variants (save-state and note backgrounds) are unchanged.

---

## Remaining-item proposal — question-count ceiling and shortlist (2026-07-07, for review)

Both remaining backlog items add **required** questions to a bank already at 228 (~45–60 min): the Section 2 Tier 3 smaller adjacents and the Section 3 strengths-based items. This section proposed a hard ceiling and a prioritized, costed shortlist so any addition would be a deliberate budget decision rather than incremental drift. **Decided 2026-07-07 — see the decision record at the end:** the required bank is capped at the current 228, Tiers A and B are deferred, and the strengths module (optional-section form) is the only remaining build candidate. The scoping below is kept as the design record should any item ever be revived.

### Proposed ceiling

- **Hard cap: 240 required items** — about +12 over the current 228 (≈ +2–4 minutes at ~13–15 s/item). Rationale: the validity layer (reverse-scored, infrequency, and consistency items) exists to catch careless, acquiescent, and inconsistent responding, and response quality degrades with length; keeping the required sitting near or under an hour protects exactly the data the rest of the tool depends on. Past ~240, the marginal item likely adds more fatigue-driven noise across all 240 answers than it adds in coverage.
- **Strengths items do not count against this cap.** They are disclosure aids, not differential-accuracy items, so they are proposed as a separate optional module (below) that neither gates the report nor consumes the required-item budget.
- **If a future need pushes past 240**, the right move is branching / conditional display (show a cluster only when a gating item is endorsed), not raising the flat cap. That is a larger architecture change and is out of scope here.

### Required-bank shortlist (differential / adjacent) — ranked

All are `condition: "differential"`, one item each unless noted, scored as a domain that raises a differential flag at ≥50% — the established pattern, so **no core-condition weights change** — each with a report note stating the limitation and what a clinician should confirm. Total if all adopted: **+9 → 237** (fits under 240 with margin), so the binding constraint is **per-item clinical justification, not the count**. Add `tests.js` domain/flag-boundary coverage and refresh the golden baseline + README count for each item landed.

**Tier A — recommend include (highest cross-misdiagnosis reduction; each fills a current gap):**
1. **Agoraphobia** — `domain: agoraphobia`, scale. Its own DSM diagnosis; only partially caught today by `anx-panic2`.
2. **Specific phobia** — `domain: specificPhobia`, scale. An anxiety category currently uncovered.
3. **Body dysmorphic disorder** — `domain: bdd`, scale. OCD-related-disorders chapter; distinct treatment pathway; not separable from OCD themes today.
4. **Tic disorder / Tourette's** — `domain: ticDisorder`. Pairs with the existing OCD tic specifier (`ticRelated`). Consider a **directional discriminator** (tic disorder vs. OCD-with-tics) that steers a recommendation only when the OCD tic signal is present — mirrors the IAD/hoarding `directions` pattern — rather than a bare flag. *(Open decision 3.)*
5. **Misophonia** — `domain: misophonia`, scale. Sound-specific intolerance, distinct from the general autistic sensory profile it is currently absorbed into; ASD/OCD adjacency.
6. **Restless legs / iron-deficiency proxy** — `domain: restlessLegs`. Common ADHD comorbidity that mimics hyperactivity / motor restlessness.

Tier A subtotal: **+6 → 234**.

**Tier B — include only if feedback or observed use justifies the added burden:**
7. **Substance specifics: caffeine + cannabis** (2 items) — split from the generic `substanceMedication` flag; both are common ADHD self-medication patterns. Lower priority because the generic flag already fires; the split mainly sharpens the recommendation text.
8. **Perimenopause / hormonal context (AFAB)** (1 item) — timing/context for adult ADHD/ASD recognition, not a differential per se. Lowest misdiagnosis-reduction value; better as an informational context item (like `ctx-developmental-regression`) than a flagging domain.

Tier B subtotal: **+3 → 237**.

### Strengths module (optional; not counted in the 240 cap)

Purpose: improve disclosure quality and counterbalance the deficit-only framing. Not a differential and not part of any condition percentage. Proposed ~5 items, original wording:
- ADHD-leaning: hyperfocus productivity/output, high drive/energy in areas of interest, rapid idea generation / creativity.
- Autism-leaning: deep expertise from focused interests, pattern recognition / systemizing, honesty / fairness / justice sensitivity, attention to detail.

**Structure decision (needs a call — open decision 4):**
- **(a) Optional section — recommended.** Introduce a required-vs-optional distinction so strengths items render but do not gate generate/export/print and are not required; surface them in the report as a short unscored "Reported strengths" list. Cost: a small, well-contained change to the completion/validation logic (currently "all questions required") and the restore-count logic. Cleanest home for non-diagnostic items and keeps them off the fatigue budget.
- **(b) Required + counted.** Simpler code, but consumes ~5 of the required budget and forces low-value gating (a report should not be blocked on a strengths question).
- **(c) Defer** until the optional-section architecture is warranted by other needs.

### Decision record (2026-07-07)

1. **Ceiling: the current 228 is the cap.** The proposed 240 was considered and rejected — growth is no longer the default. Any future required item must displace an existing one or win a specific, documented justification.
2. **Tier A and Tier B: all deferred indefinitely.** Rationale: the stopping rule for differential coverage is *"does this item change what the clinician does with the report?"* — the existing flags pass that test (check sleep, trauma, BPD, mania before interpreting core scores); these nine sharpen distinctions inside anxiety/OCD territory, which is the assessing clinician's own differential job and tangential to the tool's ADHD/ASD purpose. At symptom level everything overlaps with everything, so "overlap exists" cannot justify additions — a specific missed confound identified by real feedback can.
3. **Tic-disorder pattern:** moot while Tier A is deferred. The directional-discriminator design above stands as the recorded approach if ever revived.
4. **Strengths module: option (a) — optional section** — **BUILT 2026-07-07.** Ungated, unscored, not counted toward the required total. See the Section 3 entry for the implemented item ids, the `strengthDegree` scale, `buildStrengths`, and the required-only gating/completion changes.
5. **Confirmed** for anything ever added: screening-not-diagnosis framing, a per-item clinician-review note, and original wording (no copying from named instruments).

---

## 7. Bank-slimming review (2026-07-07) — DONE (228 → 218)

Redundancy audit of the live 228-item bank, prompted by the cap decision: instead of growing, can the sitting get *shorter* without losing construct coverage or changing what the report tells a clinician? Finding: **there are no dead items** — every domain feeds a score, a gate, a flag, or a report display — so slimming meant **merging near-duplicate items** (rewording the surviving item to carry both facets), not deleting free ones. The ADHD and OCD banks were tight; the candidates clustered in the ASD extended layer, CDS, and anxiety. **All 10 merges below were applied on 2026-07-07: −10 → 218 items** (~2–3 minutes shorter), one `STORAGE_VERSION` bump (1 → 2), golden-baseline refresh, README/TASKS count updates, and a "Retired items" appendix in `QUESTIONS.md` recording each retired id's wording, domain, and merge partner. Suite passes at 2036 assertions.

**Verified score impact (golden baseline over the deterministic full-bank answer set):** ADHD 52 (unchanged), OCD 60 (unchanged), ASD 50 → 48, AuDHD 50 → 49, CDS 62 → 68, anxiety 59 → 61. No interpretation band flipped (`level()` "moderate" throughout); the recommendation count rose 8 → 9 only because anxiety crossed the ≥60 formal-assessment threshold — the expected boundary case, not a regression.

### Tier 1 — score-neutral merges (display-only ASD domains; no condition percent changes) — DONE

These domains render in the report and notes but do not feed the ASD percent (`extendedAverage` in `scoreAsd` excludes them):

1. **Interoception** — merged `asd-l9` (missing body signals until intense) + `asd-l12` (needing external prompts for body needs): l12 was the functional consequence of l9. Surviving id `asd-l9`, reworded to carry both facets. −1
2. **Autistic burnout** — merged `asd-l11` (extended exhaustion/skill-loss episodes) + `asd-l13` (days–weeks of reduced demand before returning to baseline): same construct, episode vs. recovery framing. Surviving id `asd-l11`. −1
3. **Body-in-space** — merged `mig-prop1` (limb position/grip force) into `mig-motor2` (body-in-space/force misjudgment). The `proprioception` domain was retired entirely; `scoring.js` no longer lists it in `extendedDomains`, the `const proprioception` lookup was removed, and the MIGDAS-style note now reads "motor coordination / body-in-space". Surviving id `mig-motor2`. −1

### Tier 2 — legacy-profile-only merge (ASD percent unchanged; legacy Asperger's-style % shifts slightly) — DONE

4. **`asd-p2` + `asd-p4`** — "verbal strengths cause people to underestimate my support needs" and "appear capable in structured settings but struggle with unstructured demands" were the same capable-mask observation from two angles. Surviving id `asd-p2`, reworded to carry both. −1

### Tier 3 — scored-domain merges (small shifts in ASD/CDS/anxiety percents; construct coverage preserved) — DONE

5. **Social reciprocity** — merged `asd-a10` (not showing/sharing enjoyment as expected) + `ados-init2` (rarely spontaneously share/show/get attention): both the adult joint-attention/sharing construct. Surviving id `asd-a10`. −1
6. **Repetitive behavior** — merged `asd-b1` (repeat movements/sounds to regulate) + `asd-b14` (spin/tap/flick/handle objects): motor and object stim facets of one construct; `asd-b2` keeps the verbal/replay facet, `asd-b3` arranging, `asd-b13` visual fascination. Surviving id `asd-b1`. −1
7. **Empathic response** — merged `adir-comf1` (delayed/practical/less visible response when someone is upset) + `asd-c16` (people assume I don't care because my response doesn't match): the same visible-response mismatch, self-observed vs. others' attribution. Surviving id `adir-comf1`. −1
8. **Camouflage assimilation** — merged `asd-c11` (copy others' style to blend in) + `afab-mimicry` (adopt another's manner so seamlessly I lose track of my own traits): kept the identity-loss clause — the AFAB-masking signal that tier was added for. Surviving id `asd-c11`. −1
9. **CDS hypoactivity** — merged `cds-h2` (slower than the situation requires) + `cds-h3` (slow enough that deadlines/routines suffer): h3 was h2's impairment restatement. Surviving id `cds-h2`. −1
10. **GAD symptoms** — merged `anx-s1` (restless/keyed up) + `anx-s4` (irritable/on edge): adjacent arousal facets; `anx-s2` already bundles the somatic criteria. Surviving id `anx-s1`. −1

### Reviewed and deliberately kept (borderline pairs)

- `asd-a9` (post-social recovery time, relationships) vs. `asd-c12` (post-social depletion from self-monitoring, assimilation) — co-move for maskers, but they separate decoding effort from masking effort and feed different domains.
- `asd-c6`/`asd-c7` (imagination), `adhd-i10`/`adhd-i11` (hyperfocus), `diva-self1`/`diva-self2` (self-concept), `ocd-a2` vs. `ocd-c2` (reassurance-seeking overlap) — each pair keeps two genuinely distinct facets; merging would coarsen more than it saves.
- ADHD DSM items (9+9) are untouchable (`symptomCounts` requires `perDomain: 9`); the ESQ-R executive pairs stay at 2 items per domain for domain-average stability and a meaningful peak-vs-average display.

### Costs (apply to any adopted merge)

- Removed ids invalidate those saved answers, and surviving items get reworded, so bump `STORAGE_VERSION` once for the whole batch (the restore guard then reports the change correctly).
- Refresh the golden baseline in `tests.js`, the question count in `README.md` and this file, and any `scoring.js` note or domain list that names a removed domain.
- Merged wording must stay original and carry both facets without becoming double-barreled beyond the bank's existing style.
- Preserve each retired item in a "Retired items" appendix in `QUESTIONS.md` (id, full wording, domain, merge partner, retirement date) in the same commit — git history keeps the wording but is poorly discoverable, and the visible record lets a merge be reversed with the original wording if feedback later shows a construct was coarsened too far. Do **not** keep retired items commented out in `questions.js`.
- Tier 3 merges shift condition percents slightly for respondents who would have answered a merged pair differently; interpretation bands should not flip except at exact boundaries. Verify with `node tests.js` plus a before/after report comparison over a saved answer set.

---

## Suggested implementation order for remaining work

The required bank is now **218 items (plus 7 optional strengths), capped, and feature-complete for its purpose** (decision record in the Remaining-item proposal; the bank-slimming shortlist in Section 7 landed 2026-07-07, and the optional strengths module landed the same day). Nothing remaining is required for the tool to do its job — the highest-value next step is *using* it: complete the questionnaire, generate the report, take it to an assessment. The only remaining backlog item is intentionally deferred:

1. **`ctx-developmental-regression` scoring weight** (Section 3) — revisit only with clinician feedback; the parallel AFAB call in Section 5 Tier 2 landed on "keep informational".

---

## Notes for implementers

- All wording above is original. When implementing, keep the app's existing pattern of original construct mapping rather than reproducing items from any named instrument.
- Each new item adds to the required-question total; update `README.md` question count in the same change.
- Validity-layer items (now implemented) flag careless responding without modifying symptom percentages. Future additions to that layer should keep the same separation of meta-validity from symptom signal.
- For boundary-discrimination items (now implemented), the four `discriminator` choice types in `questions.js` (`attentionDrift`, `interestDuration`, `rigidityAetiology`, `stimFunction`) can be re-used as a template if further pairwise discriminators are added.
- After any scoring-formula change, verify weights still sum to 1.00 in each condition. This is now automated: weights live in the `WEIGHTS` object in `scoring.js` and `tests.js` asserts each vector sums to 1.00, so run `node tests.js` rather than checking by hand. If a scoring change is intentional, update the golden baseline in `tests.js` in the same commit.
