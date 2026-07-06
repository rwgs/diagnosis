# Tasks — Accuracy and Coverage Backlog

Pending work to improve screening accuracy. Organised by purpose, then by priority within each section. None of the wording below is copied from a named or licensed instrument; constructs are described using original phrasing.

Two top-level groupings:

1. **Core trait accuracy** — improvements specifically for ADHD, autism, AuDHD, and CDS scoring.
2. **Differential and adjacent conditions** — improvements that reduce cross-misdiagnosis with conditions outside the core four.

---

## Status

| Section | Status |
|---|---|
| 1. Core trait accuracy — Tier 1A (response-bias controls) | **Done** |
| 1. Core trait accuracy — Tier 1B (trait stability) | **Done** |
| 1. Core trait accuracy — Tier 2 (boundary discrimination) | **Done** |
| 1. Core trait accuracy — Tier 3 (AFAB / masked autism) | **Done** |
| 2. Differential and adjacent conditions | Pending |
| 3. Lower-priority improvements | Pending |

Question count after Section 1 work: 217.

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

## 2. Differential and adjacent conditions — PENDING

These reduce **cross-misdiagnosis** rather than improving core-trait scoring. Each addresses a common misclassification vector.

### Tier 1 — PTSD / complex PTSD

**Why it matters:** PTSD mimics ADHD (hyperarousal/hypervigilance), autism (withdrawal, dissociation), and CDS (numbing, derealisation). cPTSD particularly mimics autism and borderline patterns. Currently only `diff-trauma` flags it as one screener item.

**Five-cluster coverage (one item per cluster):**
- Intrusion / re-experiencing: unwanted memories, flashbacks, dreams of past events.
- Avoidance: actively avoiding people, places, conversations, or internal reminders.
- Negative cognition/mood: persistent shame, blame, detachment, or inability to feel positive emotions.
- Arousal/reactivity: hypervigilance, exaggerated startle, irritability, reckless behavior.
- Dissociation/derealisation: episodes of feeling unreal, detached from body, or losing time.

**Scoring integration:** New `differential` domain `ptsdComplex` with its own scoring. Adds a recommendation: "Consider PTSD differential alongside ADHD/ASD review."

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

## Suggested implementation order for remaining work

1. **PTSD cluster** (Tier 1, Section 2) — biggest differential gap; reduces false positives across ADHD, ASD, and CDS.
2. **BPD discrimination** (Tier 1, Section 2) — biggest cross-misdiagnosis vector with ADHD emotional dysregulation.
3. **IAD and hoarding-disorder discriminators** (Tier 2, Section 2) — single-item additions with high clinical specificity.
4. **Smaller adjacents** (Tier 3, Section 2) — when relevant feedback or use justifies the additional item burden.
5. **Lower-priority improvements** (Section 3) — symptom-count surfacing and peak-intensity reporting can be added as report-rendering changes without new questions.

---

## Notes for implementers

- All wording above is original. When implementing, keep the app's existing pattern of original construct mapping rather than reproducing items from any named instrument.
- Each new item adds to the required-question total; update `README.md` question count in the same change.
- Validity-layer items (now implemented) flag careless responding without modifying symptom percentages. Future additions to that layer should keep the same separation of meta-validity from symptom signal.
- For boundary-discrimination items (now implemented), the four `discriminator` choice types in `questions.js` (`attentionDrift`, `interestDuration`, `rigidityAetiology`, `stimFunction`) can be re-used as a template if further pairwise discriminators are added.
- After any scoring-formula change, verify weights still sum to 1.00 in each condition function before considering the change complete.
