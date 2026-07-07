# Candidate Questions — DIVA-5, ADOS-2, ADI-R, MIGDAS-2, CAARS/CAARS-2, Conners

Original question wording mapped to constructs covered by these instruments. Nothing here is copied from any instrument. No item in this file should be added verbatim to a licensed or commercial assessment context.

Each entry notes whether the construct is already covered in `script.js` and what would be genuinely new.

---

## DIVA-5
### Diagnostic Interview for ADHD in Adults

The DIVA-5 is a structured clinician interview that assesses all 18 DSM-5 ADHD symptom domains across two time periods (childhood and current adulthood) and maps impairment to five specific life domains. The current app covers childhood onset and global impairment but not domain-specific impairment or self-concept.

---

**Domain: Work and education impairment**
> *Currently covered globally by `ctx-impair`. Not broken out by domain.*

| ID | Question | Format |
|----|----------|--------|
| `diva-work1` | My ADHD-related difficulties — such as deadlines, errors, forgetting, organization, or starting tasks — noticeably affect my work performance, study output, or career progress. | scale |
| `diva-work2` | I have lost jobs, been passed over, changed roles, or underperformed at work or study because of attention or self-regulation difficulties, not for lack of ability or interest. | scale |

---

**Domain: Relationships and social impairment**
> *Currently covered globally. Not broken out by domain.*

| ID | Question | Format |
|----|----------|--------|
| `diva-rel1` | My ADHD-related patterns — such as interrupting, forgetting, going off-topic, being late, or over-committing — noticeably affect my relationships with a partner, family, or friends. | scale |
| `diva-rel2` | People close to me have expressed frustration, hurt, or exhaustion because of difficulties that are related to my attention, impulsivity, or emotional reactions. | scale |

---

**Domain: Self-care and daily living impairment**
> *Partially covered by `asd-l7` (adaptive function). Not covered from an ADHD perspective.*

| ID | Question | Format |
|----|----------|--------|
| `diva-adl1` | Managing meals, hygiene, sleep, medications, household tasks, finances, appointments, or paperwork regularly falls apart because of attention or self-regulation difficulties. | scale |
| `diva-adl2` | I rely on another person, phone systems, alarms, or other external structures to manage daily tasks that most adults handle independently. | scale |

---

**Domain: Self-concept and self-image**
> *Not covered anywhere in the current app. New construct.*

| ID | Question | Format |
|----|----------|--------|
| `diva-self1` | I have a persistent sense that I am broken, lazy, stupid, or fundamentally different from others, even when I know intellectually that is not accurate. | scale |
| `diva-self2` | Years of under-performing, forgetting, or falling short of what I intended to do have affected my confidence in my own abilities or reliability. | scale |

---

**Domain: Emotional lability**
> *Partially covered by `adhd-e15` (emotional control). Emotional lability — rapid mood shifts not necessarily tied to external events — is a distinct DIVA-5 and CAARS-2 subscale.*

| ID | Question | Format |
|----|----------|--------|
| `diva-emolab1` | My mood can shift rapidly — from fine to irritable, frustrated, or low — in a way that is not always explained by what is happening around me. | scale |
| `diva-emolab2` | These mood shifts tend to be short-lived (minutes to a few hours) and can change back quickly, which is different from a sustained depressed or anxious period. | scale |

---

## ADOS-2 Module 4
### Autism Diagnostic Observation Schedule — Verbal Adults

The ADOS-2 is a clinician-administered observation. Its Module 4 constructs that are not self-reportable in the usual sense (e.g., spontaneous gesture frequency, joint attention observed in session) are not suitable for direct self-report. The constructs below are those that can be meaningfully asked in first-person adult self-report form.

---

**Domain: Spontaneous social initiation**
> *Current app asks about reciprocity difficulty (asd-a1–a3) but not whether the person primarily responds rather than initiates.*

| ID | Question | Format |
|----|----------|--------|
| `ados-init1` | In conversations, I am more likely to wait for others to start topics, ask questions, or introduce something new than to initiate those things myself. | scale |
| `ados-init2` | I rarely spontaneously share something interesting, point something out, or try to get someone's attention to show them something, even with people I know well. | scale |

---

**Domain: Event description and narrative structure**
> *Not currently covered. ADOS-2 Module 4 assesses whether the person provides context, perspective, and coherent sequence when describing events.*

| ID | Question | Format |
|----|----------|--------|
| `ados-narr1` | When I describe something that happened, other people often seem confused, ask for more context, or tell me I missed out important background information. | scale |
| `ados-narr2` | I find it hard to judge how much detail, context, or explanation someone needs to understand a story I am telling. | scale |

---

**Domain: Idiosyncratic language**
> *Partially covered by asd-c1–c3 (pragmatic language). ADOS-2 specifically looks at words or phrases used in private or non-standard ways.*

| ID | Question | Format |
|----|----------|--------|
| `ados-idio1` | I use words, phrases, or expressions in ways that have personal meaning to me but that other people sometimes do not understand or find odd. | scale |
| `ados-idio2` | I have invented words, repurposed existing words, or built private labels for things that do not have a term that works for me. | scale |

---

**Domain: Social insight**
> *Covered by `adhd-e13/e14` (self-monitoring). ADOS-2 also specifically assesses awareness of how one comes across to others.*

| ID | Question | Format |
|----|----------|--------|
| `ados-insight1` | I have a limited sense of how I come across to other people in real time — I only find out later, from feedback, that I was perceived differently from how I intended. | scale |

---

## ADI-R
### Autism Diagnostic Interview — Revised

The ADI-R is a clinician-administered caregiver/parent interview assessing lifetime behavior. Most items reflect childhood behavior reported by a third party. Only the constructs that an adult can meaningfully self-report are included here.

---

**Domain: Using others' bodies as tools (childhood / historical)**
> *Not covered. Relevant to early developmental history.*

| ID | Question | Format |
|----|----------|--------|
| `adir-tool1` | As a child, I would take another person's hand and guide it toward something I wanted, rather than pointing, asking, or making eye contact to request it. | choice (historicalYesNoUnsure) |

---

**Domain: Neologisms and idiosyncratic phrases (historical and current)**
> *Partially overlaps with ados-idio above. ADI-R specifically asks about childhood-onset idiosyncratic language.*

| ID | Question | Format |
|----|----------|--------|
| `adir-neo1` | As a child or now, I have used made-up words, unusual labels, or phrases in a fixed way that had meaning to me but was not standard usage — and I have used them consistently over time. | choice (historicalYesNoUnsure) |

---

**Domain: Pointing to share interest (joint attention, historical)**
> *Not explicitly covered. The current app covers shared enjoyment indirectly via socialReciprocity.*

| ID | Question | Format |
|----|----------|--------|
| `adir-ja1` | As a child, I rarely or never spontaneously pointed at something just to show it to another person and share the experience, unless I wanted them to get it for me or do something with it. | choice (historicalYesNoUnsure) |

---

**Domain: Offering comfort**
> *Not directly covered. Related to asd-c14 (empathic response) but specifically about noticing and responding to distress unprompted.*

| ID | Question | Format |
|----|----------|--------|
| `adir-comf1` | When someone near me is visibly upset or in pain, I do not automatically move toward them or offer comfort — I may notice but not know what to do, or not notice until later. | scale |

---

**Domain: Pronoun reversal (historical)**
> *Not covered. Early language marker in ADI-R.*

| ID | Question | Format |
|----|----------|--------|
| `adir-pron1` | I have been told, or I recall, that as a child I confused or reversed pronouns — for example, referring to myself as "you" or using a name instead of "I". | choice (historicalYesNoUnsure) |

---

## MIGDAS-2
### Monteiro Interview Guidelines for Diagnosing the Autism Spectrum

The MIGDAS-2 is a semi-structured interview with modules for children, adolescents, and adults. It includes several constructs not covered or thinly covered in the current app, particularly humor, social exit cues, and movement differences.

---

**Domain: Humor processing**
> *Not currently covered. asd-c1 covers idioms and sarcasm but not humor specifically — understanding puns, comic timing, or teasing-in-fun.*

| ID | Question | Format |
|----|----------|--------|
| `mig-humor1` | I often do not know whether something is meant as a joke, irony, or sarcasm unless the other person signals it clearly — I may respond seriously when humor was intended. | scale |
| `mig-humor2` | My sense of humor is described by others as unusual, too literal, too dark, very precise, or not landing the way I expect it to. | scale |

---

**Domain: Social exit and continuation cues**
> *Not currently covered. Knowing when a social interaction should end, or when someone wants to leave.*

| ID | Question | Format |
|----|----------|--------|
| `mig-exit1` | I have difficulty knowing when a conversation or social interaction is coming to an end — I may talk too long, leave abruptly, or miss the signals that the other person wants to move on. | scale |
| `mig-exit2` | I find it hard to tell whether someone is still interested in talking with me or is politely waiting for the interaction to finish. | scale |

---

**Domain: Motor coordination and clumsiness**
> *Only flagged in `diff-learning` as a brief mention. MIGDAS-2 and ADI-R both treat motor coordination as a distinct construct.*

| ID | Question | Format |
|----|----------|--------|
| `mig-motor1` | I am noticeably clumsy, uncoordinated, or physically awkward — bumping into things, misjudging distances, tripping, or having difficulty with tasks that require fine or gross motor precision. | scale |
| `mig-motor2` | My sense of where my body is in space, or how much force I am using, is unreliable — I may grip too hard, walk too close, or not realize I am physically in someone's way. | scale |

---

**Domain: Proprioception**
> *Related to interoception (asd-l9) but proprioception — sensing limb position and body in space — is distinct.*

| ID | Question | Format |
|----|----------|--------|
| `mig-prop1` | I have difficulty knowing the position of my limbs without looking, gauging how hard I am pressing or gripping, or sensing where my body ends and objects or people begin. | scale |

---

## CAARS / CAARS-2
### Conners Adult ADHD Rating Scales

The CAARS and CAARS-2 include self-report subscales for ADHD symptoms, executive function, emotional regulation, hyperfocus, and self-concept. The emotional lability and self-concept constructs are the ones least covered by the current app.

*Note: Emotional lability questions are listed above under DIVA-5 since both instruments assess the same construct. They are not duplicated here.*

---

**Domain: ADHD and self-concept**
> *Not covered anywhere in the current app. CAARS-2 has a dedicated "problems with self-concept" subscale.*

| ID | Question | Format |
|----|----------|--------|
| `caars-self1` | I see myself as less capable, less reliable, or more of a burden than other people, and I believe this view has been shaped by years of ADHD-related struggles rather than by an accurate assessment of my abilities. | scale |
| `caars-self2` | I hide how much effort daily tasks take from me because I am embarrassed that things others find easy are hard for me. | scale |

---

**Domain: ADHD impact on partner and close relationships**
> *Currently covered globally by ctx-settings and ctx-impair. Not asked as a relationship-specific item.*

| ID | Question | Format |
|----|----------|--------|
| `caars-rel1` | A partner, spouse, or family member has had to compensate for, manage around, or clean up after my attention or impulsivity difficulties in ways that have caused tension or resentment. | scale |
| `caars-rel2` | I have ended relationships or had relationships end partly because of patterns related to ADHD — forgetting, not following through, emotional reactivity, or inconsistency. | scale |

---

## Conners Scales (Adult / CATA)
### Conners Continuous Performance Tests and Rating Scales — Adult

The Conners Adult ADHD context overlaps substantially with CAARS. The items most distinct from what is already covered are related to vigilance, sustained attention under monotony, and performance variability — constructs more naturally assessed via continuous performance tests than self-report. The self-report constructs are noted below.

---

**Domain: Vigilance and sustained attention under monotony**
> *Partially covered by adhd-i2 (sustaining attention) and cds-c1–c4. Conners CPT-style constructs specifically address attention during repetitive, low-stimulation tasks.*

| ID | Question | Format |
|----|----------|--------|
| `cata-vig1` | My attention fails fastest on tasks that are repetitive, predictable, or slow-paced — I can manage better when tasks are novel, fast, urgent, or interesting. | scale |
| `cata-vig2` | My performance is highly inconsistent — I can do something well one day and fail at the same task another day, depending on interest, energy, or whether anything is riding on it. | scale |

---

**Domain: Processing speed variability**
> *Related to cds-h2/h3 (hypoactivity/slow processing). Conners distinguishes this from CDS-type slowness as response variability under timed conditions.*

| ID | Question | Format |
|----|----------|--------|
| `cata-spd1` | My reaction time or processing speed is inconsistent — sometimes I am quick and sharp, other times slow or delayed — without an obvious explanation such as tiredness. | scale |

---

## Coverage summary

| Construct | Instrument(s) | New to app? | Suggested IDs |
|---|---|---|---|
| Work/education domain impairment | DIVA-5 | Yes | `diva-work1/2` |
| Relationship domain impairment | DIVA-5, CAARS | Yes | `diva-rel1/2`, `caars-rel1/2` |
| Daily living impairment (ADHD) | DIVA-5 | Partial (asd-l7 covers ASD side) | `diva-adl1/2` |
| ADHD self-concept / self-image | DIVA-5, CAARS-2 | Yes | `diva-self1/2`, `caars-self1/2` |
| Emotional lability (rapid mood shifts) | DIVA-5, CAARS-2 | Yes | `diva-emolab1/2` |
| Spontaneous social initiation | ADOS-2 | Yes | `ados-init1/2` |
| Narrative / event description structure | ADOS-2 | Yes | `ados-narr1/2` |
| Idiosyncratic / private language | ADOS-2, ADI-R | Partial (asd-c1–c3) | `ados-idio1/2`, `adir-neo1` |
| Social insight (real-time) | ADOS-2 | Partial (adhd-e13/14) | `ados-insight1` |
| Using others as tools (childhood) | ADI-R | Yes | `adir-tool1` |
| Pointing to share interest (childhood) | ADI-R | Yes | `adir-ja1` |
| Offering comfort to others | ADI-R | Yes | `adir-comf1` |
| Pronoun reversal (childhood) | ADI-R | Yes | `adir-pron1` |
| Humor processing | MIGDAS-2 | Yes | `mig-humor1/2` |
| Social exit / conversation end cues | MIGDAS-2 | Yes | `mig-exit1/2` |
| Motor coordination / clumsiness | MIGDAS-2, ADI-R | Yes | `mig-motor1/2` |
| Proprioception | MIGDAS-2 | Yes | `mig-prop1` |
| Vigilance / attention under monotony | Conners CATA | Partial (adhd-i2, cds-c1–c4) | `cata-vig1/2` |
| Performance / processing variability | Conners CATA | Partial (cds-h2/h3) | `cata-spd1` |

---

## Notes for integration

**Priority additions** (clinically significant, not covered at all):
1. ADHD self-concept (`diva-self1/2`, `caars-self1/2`) — persistent and impairing, drives help-seeking
2. Humor processing (`mig-humor1/2`) — distinct from literal/sarcasm coverage; frequently reported by autistic adults
3. Social exit cues (`mig-exit1/2`) — common impairment not currently asked
4. Emotional lability (`diva-emolab1/2`) — distinct from RSD and emotional control; CAARS-2 subscale
5. Motor coordination (`mig-motor1/2`) — MIGDAS-2 and ADI-R both treat this as distinct; one question currently only in differential

**Moderate priority** (adds nuance, partially covered):
- Spontaneous social initiation (`ados-init1/2`)
- Narrative structure (`ados-narr1/2`)
- Daily living impairment ADHD-specific (`diva-adl1/2`)
- Relationship impairment ADHD-specific (`diva-rel1/2`)
- Performance variability (`cata-vig1/2`, `cata-spd1`)

**Lower priority for self-report** (childhood retrospective, or better assessed via interview):
- Pronoun reversal (`adir-pron1`) — useful as a historical flag but low self-report reliability in adults
- Using others as tools (`adir-tool1`) — same caveat
- Pointing to share (`adir-ja1`) — same caveat
- Offering comfort (`adir-comf1`) — partially covered by asd-c14
- Proprioception (`mig-prop1`) — overlaps with interoception (asd-l9) and motor questions; **retired 2026-07-07** and folded into `mig-motor2` (see Retired items)

---

## Retired items (bank-slimming merges)

Items removed from the live bank when a near-duplicate pair was merged into a single reworded surviving item, so respondent burden dropped without losing construct coverage. Git history keeps prior wording, but this record makes a merge reversible if later feedback shows a construct was coarsened too far. Do **not** re-add these to `questions.js` commented out; revive from this table if needed.

### 2026-07-07 — 228 → 218 (Section 7 bank-slimming, `STORAGE_VERSION` 1 → 2)

| Retired id | Domain | Original wording | Merged into (surviving id) |
|---|---|---|---|
| `asd-l12` | `interoception` | "I need external prompts, routines, alarms, another person, or visible supplies to notice body needs such as eating, drinking, resting, medication, hygiene, or using the bathroom." | `asd-l9` (miss body signals until intense + reliance on external prompts) |
| `asd-l13` | `autisticBurnout` | "After prolonged masking, sensory overload, social demand, or life stress, I can need days or weeks of reduced demand before my thinking, speech, daily living, or emotional regulation returns toward baseline." | `asd-l11` (burnout episode + recovery framing) |
| `mig-prop1` | `proprioception` (domain retired) | "I have difficulty sensing limb position, pressure, grip force, or where my body ends and nearby objects or people begin unless I look or consciously check." | `mig-motor2` (`motorCoordination`; body-in-space/limb-position/grip facet folded in) |
| `asd-p4` | `aspergerProfile` | "I can appear capable in structured settings but have difficulty with unstructured social expectations or daily-life demands." | `asd-p2` (verbal strengths underestimate support needs + capable-mask observation) |
| `ados-init2` | `socialReciprocity` | "I rarely spontaneously share something interesting, point something out, or try to get someone's attention to show them something, even with people I know well." | `asd-a10` (adult joint-attention/sharing) |
| `asd-b14` | `repetitiveBehavior` | "I spin, tap, flick, twirl, smell, or repeatedly handle objects in an absorbing, calming, or automatic way." | `asd-b1` (motor + object stim facets) |
| `asd-c16` | `empathicResponse` | "People assume I do not care because my face, voice, timing, or practical response does not match what they expect." | `adir-comf1` (visible-response mismatch, self-observed + others' attribution) |
| `afab-mimicry` | `camouflageAssimilation` | "I can adopt another person's manner of speaking, opinions, gestures, or interests so seamlessly that I sometimes lose track of which traits are originally mine." | `asd-c11` (copy others' style; identity-loss clause preserved — the AFAB-masking signal) |
| `cds-h3` | `hypoactivity` | "My pace is slow enough that deadlines, conversations, errands, or daily routines become harder." | `cds-h2` (slow pace + its impairment consequence) |
| `anx-s4` | `gadSymptoms` | "I become irritable, on edge, or easily overwhelmed when anxious." | `anx-s1` (restless/keyed-up + irritable/on-edge) |

The `proprioception` domain was retired entirely (its only item was `mig-prop1`); `scoring.js` no longer lists it in `extendedDomains` and the MIGDAS-style note now reads "motor coordination / body-in-space". Tier 1–2 merges are score-neutral for condition percentages (display-only or legacy-profile-only domains); Tier 3 merges shift the ASD/CDS/anxiety percentages slightly for respondents who would have answered a merged pair differently.
