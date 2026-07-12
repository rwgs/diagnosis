// tests.js — dependency-free regression tests for the pure scoring core.
//
// Run with:  node tests.js
//
// Covers the invariants that Section 2 (differential/adjacent) scoring work
// must not silently break:
//   1. Every WEIGHTS vector sums to 1.00.
//   2. Discriminator bonuses stay within the documented ADHD/ASD/CDS caps.
//   3. Validity flags fire (and stay quiet) at their intended boundaries.
//   4. Level / support / gate / insight / ADHD-presentation thresholds.
//   5. A full-report golden baseline over the whole live question bank
//      (validated byte-for-byte against the pre-split implementation).
//   6. The developmental-regression sensitivity: the primary ASD percent is
//      unaffected by the regression answer, while the counterfactual
//      (regression weighted into the gate) moves within its documented bound.

const path = require("path");

// The live question bank assigns to a browser global; shim it for Node.
global.window = {};
require(path.join(__dirname, "questions.js"));
const bank = global.window.SCREENING_QUESTION_DATA;
const { SCALE, CHOICES } = bank;

const S = require(path.join(__dirname, "scoring.js"));
const P = require(path.join(__dirname, "pdf.js"));

// ---- tiny assert harness -------------------------------------------------
let passed = 0;
let failed = 0;
function ok(cond, message) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error("  FAIL:", message);
  }
}
function eq(actual, expected, message) {
  ok(actual === expected, `${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function close(actual, expected, tol, message) {
  ok(Math.abs(actual - expected) <= tol, `${message} — expected ~${expected}, got ${actual}`);
}
function section(name) {
  console.log(name);
}

// ---- 1. weight vectors sum to 1.00 --------------------------------------
section("1. WEIGHTS vectors sum to 1.00");
Object.entries(S.WEIGHTS).forEach(([name, vec]) => {
  const sum = Object.values(vec).reduce((s, w) => s + w, 0);
  close(sum, 1, 1e-9, `WEIGHTS.${name} sums to 1.00 (got ${sum})`);
});

// ---- 2. discriminator caps ----------------------------------------------
section("2. Discriminator bonuses stay within caps");
const discQuestions = [
  { id: "d-drift", condition: "discriminator", domain: "attentionDrift" },
  { id: "d-interest", condition: "discriminator", domain: "interestDuration" },
  { id: "d-rigidity", condition: "discriminator", domain: "rigidityAetiology" },
  { id: "d-stim", condition: "discriminator", domain: "stimFunction" },
];
const DISC_VALUES = [1, 0, 0.5, 0.25, null]; // null == unanswered (omit)
const extremes = {
  adhd: { fn: S.adhdDiscriminatorBonus, cap: S.DISCRIMINATOR_CAPS.adhd, max: -Infinity, min: Infinity },
  asd: { fn: S.asdDiscriminatorBonus, cap: S.DISCRIMINATOR_CAPS.asd, max: -Infinity, min: Infinity },
  cds: { fn: S.cdsDiscriminatorBonus, cap: S.DISCRIMINATOR_CAPS.cds, max: -Infinity, min: Infinity },
};
for (const drift of DISC_VALUES) {
  for (const interest of DISC_VALUES) {
    for (const rigidity of DISC_VALUES) {
      for (const stim of DISC_VALUES) {
        const answers = {};
        const set = (id, v) => { if (v !== null) answers[id] = { value: v }; };
        set("d-drift", drift);
        set("d-interest", interest);
        set("d-rigidity", rigidity);
        set("d-stim", stim);
        for (const key of Object.keys(extremes)) {
          const b = extremes[key].fn(discQuestions, answers);
          ok(Math.abs(b) <= extremes[key].cap + 1e-9,
            `${key} discriminator bonus ${b} within +/-${extremes[key].cap}`);
          extremes[key].max = Math.max(extremes[key].max, b);
          extremes[key].min = Math.min(extremes[key].min, b);
        }
      }
    }
  }
}
close(extremes.adhd.max, 9, 1e-9, "ADHD bonus reaches +9");
close(extremes.adhd.min, -9, 1e-9, "ADHD bonus reaches -9");
close(extremes.asd.max, 6, 1e-9, "ASD bonus reaches +6");
close(extremes.asd.min, -6, 1e-9, "ASD bonus reaches -6");
close(extremes.cds.max, 5, 1e-9, "CDS bonus reaches +5");
close(extremes.cds.min, -5, 1e-9, "CDS bonus reaches -5");

// ---- 3. validity-flag firing conditions ---------------------------------
section("3. Validity flags fire at their boundaries");
const val = (answers, conditions) => S.computeValidityFlags([], answers, conditions);
const has = (flags, needle) => flags.some((f) => f.includes(needle));

// reverse-inattention: both high (reverseScore >= 70 && inatt >= 70)
let f = val({ "val-reverse-inatt": { value: 2.8 } }, { adhd: { domains: { Inattention: { percent: 70 } } } });
eq(f.length, 1, "reverse-inatt both-high fires exactly one flag");
ok(has(f, "Inattention check"), "reverse-inatt both-high mentions Inattention check");
// just below the reverse threshold => no flag
f = val({ "val-reverse-inatt": { value: 2.7 } }, { adhd: { domains: { Inattention: { percent: 70 } } } });
eq(f.length, 0, "reverse-inatt just below threshold does not fire");
// both low (reverseScore <= 25 && inatt <= 25)
f = val({ "val-reverse-inatt": { value: 1.0 } }, { adhd: { domains: { Inattention: { percent: 25 } } } });
eq(f.length, 1, "reverse-inatt both-low fires");

// reverse-social: reads asd "Nonverbal communication". Both high (>=70), just
// below threshold, and both low (<=25).
f = val({ "val-reverse-social": { value: 2.8 } }, { asd: { domains: { "Nonverbal communication": { percent: 70 } } } });
eq(f.length, 1, "reverse-social both-high fires exactly one flag");
ok(has(f, "Social-communication check"), "reverse-social both-high mentions Social-communication check");
f = val({ "val-reverse-social": { value: 2.7 } }, { asd: { domains: { "Nonverbal communication": { percent: 70 } } } });
eq(f.length, 0, "reverse-social just below threshold does not fire");
f = val({ "val-reverse-social": { value: 1.0 } }, { asd: { domains: { "Nonverbal communication": { percent: 25 } } } });
eq(f.length, 1, "reverse-social both-low fires");

// reverse-emotion: reads adhd "Emotional control". Both high (>=70), just below
// threshold, and both low (<=25).
f = val({ "val-reverse-emotion": { value: 2.8 } }, { adhd: { domains: { "Emotional control": { percent: 70 } } } });
eq(f.length, 1, "reverse-emotion both-high fires exactly one flag");
ok(has(f, "Emotional-regulation check"), "reverse-emotion both-high mentions Emotional-regulation check");
f = val({ "val-reverse-emotion": { value: 2.7 } }, { adhd: { domains: { "Emotional control": { percent: 70 } } } });
eq(f.length, 0, "reverse-emotion just below threshold does not fire");
f = val({ "val-reverse-emotion": { value: 1.0 } }, { adhd: { domains: { "Emotional control": { percent: 25 } } } });
eq(f.length, 1, "reverse-emotion both-low fires");

// infrequency probe
f = val({ "val-infrequency": { value: 0.75 } }, {});
eq(f.length, 1, "infrequency at 0.75 fires");
f = val({ "val-infrequency": { value: 0.5 } }, {});
eq(f.length, 0, "infrequency at 0.5 does not fire");

// consistency pair: |diff| >= 2 fires
f = val({ "val-consist-objects": { value: 4 }, "adhd-i7": { value: 0 } }, {});
eq(f.length, 1, "consistency pair with diff 4 fires");
f = val({ "val-consist-objects": { value: 1 }, "adhd-i7": { value: 0 } }, {});
eq(f.length, 0, "consistency pair with diff 1 does not fire");

// clean sheet
eq(val({}, {}).length, 0, "no answers -> no validity flags");

// ---- 4. threshold boundaries --------------------------------------------
section("4. Threshold labels at boundaries");
eq(S.level(70), "high", "level 70 = high");
eq(S.level(69), "moderate", "level 69 = moderate");
eq(S.level(45), "moderate", "level 45 = moderate");
eq(S.level(44), "low", "level 44 = low");

eq(S.supportLevelLabel(82), "Level 3-style / very substantial support", "support 82 = L3");
eq(S.supportLevelLabel(81), "Level 2-style / substantial support", "support 81 = L2");
eq(S.supportLevelLabel(62), "Level 2-style / substantial support", "support 62 = L2");
eq(S.supportLevelLabel(61), "Level 1-style / support", "support 61 = L1");
eq(S.supportLevelLabel(42), "Level 1-style / support", "support 42 = L1");
eq(S.supportLevelLabel(41), "below Level 1-style support threshold", "support 41 = below L1");

eq(S.gateLabel(0.8), "yes/strong", "gate 0.8 = yes/strong");
eq(S.gateLabel(0.45), "partial/unsure", "gate 0.45 = partial/unsure");
eq(S.gateLabel(0.44), "limited", "gate 0.44 = limited");
eq(S.gateLabel(0), "not endorsed", "gate 0 = not endorsed");

eq(S.insightLabel(75), "absent insight or delusional-level conviction while triggered", "insight 75");
eq(S.insightLabel(74), "poor insight while triggered", "insight 74");
eq(S.insightLabel(50), "poor insight while triggered", "insight 50");
eq(S.insightLabel(49), "fair or variable insight", "insight 49");
eq(S.insightLabel(25), "fair or variable insight", "insight 25");
eq(S.insightLabel(24), "good/fair insight", "insight 24");

// ---- 4b. ADHD presentation thresholds (drives real scoreAdhd) ------------
section("4b. ADHD presentation thresholds");
function zeroContext() {
  return {
    adhdChildhood: 0, settings: 0, impairment: 0, traitStability: 0,
    asdEarly: 0, masking: 0, supportNeed: 0,
    lifetimeContinuity: 0, symptomFreeIntervals: 0,
  };
}
// Build 9 inattention + 9 hyperactive scale questions with explicit per-item values.
function adhdInputs(inattVals, hyperVals) {
  const questions = [];
  const answers = {};
  inattVals.forEach((v, i) => {
    const id = `inatt${i}`;
    questions.push({ id, condition: "adhd", domain: "inattention" });
    answers[id] = { value: v };
  });
  hyperVals.forEach((v, i) => {
    const id = `hyper${i}`;
    questions.push({ id, condition: "adhd", domain: "hyperImpulsive" });
    answers[id] = { value: v };
  });
  return { questions, answers };
}
function presentationOf(inattVals, hyperVals) {
  const { questions, answers } = adhdInputs(inattVals, hyperVals);
  return S.scoreAdhd(questions, answers, zeroContext()).summary;
}
const five4 = [4, 4, 4, 4, 4, 0, 0, 0, 0]; // countOften 5, percent ~56
const low1 = [1, 1, 1, 1, 1, 1, 1, 1, 1];   // countOften 0, percent 25
const mid2 = [2, 2, 2, 2, 2, 2, 2, 2, 2];   // countOften 0, percent 50
const broad = [4, 4, 4, 4, 1, 1, 1, 1, 1];  // countOften 4, percent ~58
eq(presentationOf(five4, five4), "Combined presentation signal", "both countOften>=5 => Combined");
eq(presentationOf(five4, low1), "Predominantly inattentive presentation signal", "inatt countOften>=5 => inattentive");
eq(presentationOf(low1, five4), "Predominantly hyperactive-impulsive presentation signal", "hyper countOften>=5 => hyperactive");
eq(presentationOf(broad, broad), "Broad ADHD traits below adult DSM-style symptom-count threshold", "both >=55%, countOften<5 => Broad");
eq(presentationOf(mid2, low1), "Inattentive traits", "inatt >= hyper+12 => Inattentive traits");
eq(presentationOf(low1, mid2), "Hyperactive-impulsive traits", "hyper >= inatt+12 => Hyperactive-impulsive traits");
eq(presentationOf(low1, low1), "Subthreshold or mixed traits", "both low => Subthreshold");

// ---- 4c. PTSD / trauma-related differential domain -----------------------
section("4c. PTSD differential domain (ptsdComplex)");
const PTSD_LABEL = "PTSD / trauma-related pattern";
const ptsdQuestions = ["intrusion", "avoidance", "cognition", "arousal", "dissociation"].map((k) => ({
  id: `diff-ptsd-${k}`, condition: "differential", domain: "ptsdComplex", type: "scale",
}));
function ptsdDifferential(value) {
  const answers = {};
  ptsdQuestions.forEach((q) => { answers[q.id] = { value }; });
  return S.scoreDifferential(ptsdQuestions, answers);
}
const ptsdHigh = ptsdDifferential(4);
eq(ptsdHigh.domains[PTSD_LABEL].percent, 100, "all-4 PTSD items => 100%");
ok(ptsdHigh.flags.some((f) => f.startsWith(PTSD_LABEL)), "elevated PTSD raises a differential flag");
const ptsdMid = ptsdDifferential(2);
eq(ptsdMid.domains[PTSD_LABEL].percent, 50, "all-2 PTSD items => 50%");
ok(ptsdMid.flags.some((f) => f.startsWith(PTSD_LABEL)), "PTSD flags at exactly 50%");
const ptsdLow = ptsdDifferential(0);
eq(ptsdLow.domains[PTSD_LABEL].percent, 0, "all-0 PTSD items => 0%");
ok(!ptsdLow.flags.some((f) => f.includes("PTSD")), "PTSD does not flag when absent");
// the 5 live PTSD items are present in the bank
eq(allQuestions().filter((q) => q.domain === "ptsdComplex").length, 5, "bank has 5 ptsdComplex items");

// ---- 4d. Borderline / emotional-dysregulation differential domain --------
section("4d. Borderline differential domain (borderlinePattern)");
const bpdQuestions = ["identity", "splitting", "emptiness", "abandonment"].map((k) => ({
  id: `diff-bpd-${k}`, condition: "differential", domain: "borderlinePattern", type: "scale",
}));
function bpdDifferential(value) {
  const answers = {};
  bpdQuestions.forEach((q) => { answers[q.id] = { value }; });
  return S.scoreDifferential(bpdQuestions, answers);
}
const bpdHigh = bpdDifferential(4);
eq(bpdHigh.domains["Borderline / emotional dysregulation"].percent, 100, "all-4 BPD items => 100%");
ok(bpdHigh.flags.some((f) => f.startsWith("Borderline")), "elevated BPD raises a differential flag");
const bpdMid = bpdDifferential(2);
eq(bpdMid.domains["Borderline / emotional dysregulation"].percent, 50, "all-2 BPD items => 50%");
ok(bpdMid.flags.some((f) => f.startsWith("Borderline")), "BPD flags at exactly 50%");
const bpdLow = bpdDifferential(0);
eq(bpdLow.domains["Borderline / emotional dysregulation"].percent, 0, "all-0 BPD items => 0%");
ok(!bpdLow.flags.some((f) => f.startsWith("Borderline")), "BPD does not flag when absent");
eq(allQuestions().filter((q) => q.domain === "borderlinePattern").length, 4, "bank has 4 borderlinePattern items");

// ---- 4e. IAD / hoarding directional discriminators -----------------------
section("4e. IAD / hoarding directional discriminators");
const dirQuestions = [
  { id: "diff-iad-direction", condition: "differential", domain: "iadDirection", type: "choice" },
  { id: "diff-hoard-direction", condition: "differential", domain: "hoardingDirection", type: "choice" },
];
function directionsFor(iadVal, hoardVal) {
  const answers = {};
  if (iadVal !== null) answers["diff-iad-direction"] = { value: iadVal };
  if (hoardVal !== null) answers["diff-hoard-direction"] = { value: hoardVal };
  return S.scoreDifferential(dirQuestions, answers).directions;
}
eq(directionsFor(1, 1).iad, 1, "IAD direction Yes => 1");
eq(directionsFor(1, 1).hoarding, 1, "hoarding direction Yes => 1");
eq(directionsFor(0, 0).iad, 0, "IAD direction No => 0");
eq(directionsFor(0.5, 0.5).iad, 0.5, "IAD direction Unsure => 0.5");
eq(directionsFor(null, null).iad, 0, "unanswered IAD direction => 0");
// directional items must not create their own differential flags
const dirOnly = S.scoreDifferential(dirQuestions, { "diff-iad-direction": { value: 1 }, "diff-hoard-direction": { value: 1 } });
eq(dirOnly.flags.length, 0, "directional discriminators raise no differential flags");
eq(allQuestions().filter((q) => q.domain === "iadDirection").length, 1, "bank has 1 iadDirection item");
eq(allQuestions().filter((q) => q.domain === "hoardingDirection").length, 1, "bank has 1 hoardingDirection item");

// ---- 4f. Safety item states: endorsed / uncertain / declined -------------
section("4f. Safety item endorsed / uncertain / declined states");
const riskQuestions = [
  { id: "diff-risk-self", condition: "differential", domain: "riskSelf", type: "choice" },
  { id: "diff-risk-other", condition: "differential", domain: "riskOther", type: "choice" },
];
const YES = { value: 4, label: "Yes" };
const UNSURE = { value: 2, label: "Unsure" };
const NO = { value: 0, label: "No" };
const DECLINE = { value: 3, label: "Prefer not to say" };
function safetyFor(self, other) {
  const answers = {};
  if (self) answers["diff-risk-self"] = self;
  if (other) answers["diff-risk-other"] = other;
  return S.scoreDifferential(riskQuestions, answers);
}
// endorsed via Yes: genuine endorsement, shows a percent
let sf = safetyFor(YES, NO);
ok(sf.safety.endorsed && !sf.safety.uncertain && !sf.safety.declined, "Yes marks endorsed only");
ok(/endorsed at a clinically important level/.test(sf.safety.note), "endorsed note uses endorsement wording");
ok(sf.flags.includes("Current self-harm risk 100%"), "endorsed risk flag shows a percent");
// Unsure (50%): uncertainty, NOT an endorsement, and no pseudo-severity percent
sf = safetyFor(UNSURE, NO);
ok(sf.safety.uncertain && !sf.safety.endorsed && !sf.safety.declined, "Unsure marks uncertain, not endorsed");
ok(/Unsure/.test(sf.safety.note) && !/\bendorsed\b/.test(sf.safety.note), "uncertain note names uncertainty, not endorsement");
ok(sf.flags.includes("Current self-harm risk (unsure)"), "uncertain risk flag reads '(unsure)', not a percent");
ok(!sf.flags.some((f) => /Current self-harm risk \d/.test(f)), "uncertain risk flag carries no percent");
// declined only: still flags (conservative), but not as an endorsement or a percent
sf = safetyFor(DECLINE, NO);
ok(sf.safety.declined && !sf.safety.endorsed && !sf.safety.uncertain, "decline marks declined only");
ok(/declined/i.test(sf.safety.note) && !/\bendorsed\b/.test(sf.safety.note), "declined note avoids the word 'endorsed'");
ok(sf.flags.includes("Current self-harm risk (declined to answer)"), "declined risk flag reads 'declined to answer', not a percent");
// combinations co-occur independently across the two items
sf = safetyFor(YES, UNSURE);
ok(sf.safety.endorsed && sf.safety.uncertain && !sf.safety.declined, "Yes + Unsure marks both endorsed and uncertain");
sf = safetyFor(YES, DECLINE);
ok(sf.safety.endorsed && sf.safety.declined, "Yes + decline marks both endorsed and declined");
ok(/endorsed/.test(sf.safety.note) && /declined/.test(sf.safety.note), "mixed note mentions both endorsement and decline");
sf = safetyFor(UNSURE, DECLINE);
ok(sf.safety.uncertain && sf.safety.declined && !sf.safety.endorsed, "Unsure + decline marks uncertain and declined, not endorsed");
// neither
sf = safetyFor(NO, NO);
eq(sf.safety.note, null, "no risk => no safety note");
ok(!sf.flags.some((f) => f.startsWith("Current self-harm")), "no self-harm flag when answered No");
// standing immediate-danger guidance the render layer always shows
ok(/emergency services/i.test(S.SAFETY_IMMEDIATE_DANGER) && /(988|crisis)/i.test(S.SAFETY_IMMEDIATE_DANGER), "immediate-danger guidance names emergency services and crisis support");

// ---- 4g. AuDHD interaction domains are detection flags, not percentages --
section("4g. AuDHD interaction domains render as detection flags");
const auCtx = { supportNeed: 0 };
// Both conditions elevated with a masking trigger (Sameness + Organization).
const adhdDetect = { percent: 60, domains: { Organization: { percent: 80 } } };
const asdDetect = { percent: 60, domains: { "Sameness and transitions": { percent: 80 } } };
let au = S.scoreAudhd(adhdDetect, asdDetect, auCtx);
eq(au.domains["Masking interactions"].detected, true, "masking trigger => detected:true");
ok(!("percent" in au.domains["Masking interactions"]), "masking interaction carries no percent field");
// Both elevated but no pattern crosses threshold (all lookups resolve to 0).
au = S.scoreAudhd({ percent: 60, domains: {} }, { percent: 60, domains: {} }, auCtx);
eq(au.domains["Masking interactions"].detected, false, "no trigger => masking detected:false");
eq(au.domains["Mimicking interactions"].detected, false, "no trigger => mimic detected:false");
eq(au.domains["Amplifying interactions"].detected, false, "no trigger => amplify detected:false");
// The genuine ADHD / Autism siblings still carry a numeric percent.
eq(au.domains.ADHD.percent, 60, "ADHD interaction sibling keeps its percent");

// ---- 4h. Domain peak (max item) and ADHD symptom counts -----------------
section("4h. Domain peak and ADHD symptom counts");
const peakQuestions = [
  { id: "px1", condition: "adhd", domain: "inattention" },
  { id: "px2", condition: "adhd", domain: "inattention" },
];
// Mixed 4 + 2 => average 3 (percent 75), peak = max 4 => 100.
let ds = S.domainStats("adhd", "inattention", peakQuestions, { px1: { value: 4 }, px2: { value: 2 } });
eq(ds.percent, 75, "mixed domain percent = 75");
eq(ds.peak, 100, "mixed domain peak = 100 (above average)");
// Uniform 3 + 3 => average 3 (percent 75), peak = 75 (no spread).
ds = S.domainStats("adhd", "inattention", peakQuestions, { px1: { value: 3 }, px2: { value: 3 } });
eq(ds.peak, 75, "flat domain peak equals percent");
// Empty domain still exposes peak.
eq(S.domainStats("adhd", "absent", peakQuestions, {}).peak, 0, "empty domain peak = 0");

// ADHD scorer exposes structured symptom counts against the adult threshold.
const scInputs = adhdInputs([4, 4, 4, 4, 4, 0, 0, 0, 0], [3, 3, 3, 0, 0, 0, 0, 0, 0]);
const scAdhd = S.scoreAdhd(scInputs.questions, scInputs.answers, zeroContext());
eq(scAdhd.symptomCounts.inattentiveOften, 5, "symptomCounts inattentiveOften = 5");
eq(scAdhd.symptomCounts.hyperOften, 3, "symptomCounts hyperOften = 3");
eq(scAdhd.symptomCounts.perDomain, 9, "symptomCounts perDomain = 9");
eq(scAdhd.symptomCounts.adultThreshold, 5, "symptomCounts adultThreshold = 5");
// The count is no longer duplicated as a free-text note.
ok(!scAdhd.notes.some((n) => /rated Often or Very often/.test(n)), "symptom-count note removed from notes array");

// ---- 4i. buildRecommendations trigger thresholds -------------------------
section("4i. buildRecommendations trigger thresholds");
// Minimal report skeleton: everything low/empty so no recommendation fires
// until a test raises the relevant input past its threshold.
function baseReport() {
  const cond = (key, label) => ({ key, label, percent: 0, domains: {} });
  return {
    conditions: {
      adhd: cond("adhd", "ADHD"),
      asd: cond("asd", "Autism Spectrum"),
      audhd: cond("audhd", "AuDHD Co-occurrence"),
      ocd: cond("ocd", "OCD"),
      cds: cond("cds", "Cognitive Disengagement Syndrome"),
      anxiety: cond("anxiety", "Anxiety"),
    },
    context: { literalInterpretation: 0, masking: 0 },
    differential: { flags: [], domains: {}, directions: { iad: 0, hoarding: 0 }, priorityFlag: false },
  };
}
const RECS_LABELS = { adhd: "ADHD", asd: "Autism Spectrum", audhd: "AuDHD Co-occurrence", ocd: "OCD", cds: "CDS", anxiety: "Anxiety" };
const recsFor = (r) => S.buildRecommendations(r, RECS_LABELS);
const someRec = (arr, needle) => arr.some((x) => x.includes(needle));

// all-low -> only the fallback
let rep = baseReport();
let out = recsFor(rep);
eq(out.length, 1, "all-low report yields only the fallback recommendation");
ok(someRec(out, "Scores are mostly low"), "fallback recommendation present when nothing triggers");

// formal-assessment loop: fires at >=60, uses conditionLabels, sorts desc
rep = baseReport();
rep.conditions.ocd.percent = 60;   // boundary
rep.conditions.cds.percent = 72;   // higher -> sorts first; also trips CDS note
out = recsFor(rep);
ok(someRec(out, "Ask for formal assessment of CDS; screening match is 72%."), "formal-assessment uses conditionLabels short form and rounded percent");
ok(someRec(out, "Ask for formal assessment of OCD; screening match is 60%."), "formal-assessment fires at exactly 60%");
ok(out.findIndex((x) => x.includes("assessment of CDS")) < out.findIndex((x) => x.includes("assessment of OCD")), "formal-assessment recs sorted by descending percent");
rep = baseReport();
rep.conditions.ocd.percent = 59;
ok(!someRec(recsFor(rep), "formal assessment of OCD"), "no formal-assessment rec at 59%");

// ADHD + ASD pairing at 55/55
rep = baseReport(); rep.conditions.adhd.percent = 55; rep.conditions.asd.percent = 55;
ok(someRec(recsFor(rep), "evaluate ADHD and autism together"), "ADHD+ASD pairing fires at 55/55");
rep = baseReport(); rep.conditions.adhd.percent = 55; rep.conditions.asd.percent = 54;
ok(!someRec(recsFor(rep), "evaluate ADHD and autism together"), "pairing does not fire when ASD is 54");

// literal interpretation / masking at >=50
rep = baseReport(); rep.context.literalInterpretation = 50;
ok(someRec(recsFor(rep), "literal interpretation, masking"), "literal-interpretation rec fires at 50");
rep = baseReport(); rep.context.masking = 50;
ok(someRec(recsFor(rep), "literal interpretation, masking"), "masking rec fires at 50");
rep = baseReport(); rep.context.literalInterpretation = 49; rep.context.masking = 49;
ok(!someRec(recsFor(rep), "literal interpretation, masking"), "no literal/masking rec below 50");

// differential flags -> review-factors line
rep = baseReport(); rep.differential.flags = ["Burnout 75%"];
ok(someRec(recsFor(rep), "Review differential factors: Burnout 75%."), "differential-flags rec lists the flags verbatim");

// priority-differential keys off the precomputed boolean
rep = baseReport(); rep.differential.priorityFlag = true;
ok(someRec(recsFor(rep), "Prioritize clinical review of mania/hypomania"), "priority rec keys off differential.priorityFlag");
rep = baseReport();
ok(!someRec(recsFor(rep), "Prioritize clinical review of mania/hypomania"), "no priority rec when flag false");

// PTSD >=50 (and guarded when the domain is absent)
rep = baseReport(); rep.differential.domains["PTSD / trauma-related pattern"] = { percent: 50 };
ok(someRec(recsFor(rep), "Consider a PTSD or other trauma-related differential"), "PTSD rec fires at 50");
rep = baseReport(); rep.differential.domains["PTSD / trauma-related pattern"] = { percent: 49 };
ok(!someRec(recsFor(rep), "Consider a PTSD or other trauma-related differential"), "no PTSD rec at 49");
rep = baseReport();
ok(!someRec(recsFor(rep), "Consider a PTSD or other trauma-related differential"), "PTSD rec absent (no throw) when domain missing");

// BPD co-elevation gate: BPD>=50 AND an ADHD emotion domain >=50
rep = baseReport(); rep.differential.domains["Borderline / emotional dysregulation"] = { percent: 50 };
ok(!someRec(recsFor(rep), "borderline / emotional-dysregulation differential"), "BPD rec needs ADHD emotion co-elevation");
rep = baseReport();
rep.differential.domains["Borderline / emotional dysregulation"] = { percent: 50 };
rep.conditions.adhd.domains["Emotional lability"] = { percent: 50 };
ok(someRec(recsFor(rep), "borderline / emotional-dysregulation differential"), "BPD rec fires with BPD>=50 and emotional lability>=50");
rep = baseReport();
rep.differential.domains["Borderline / emotional dysregulation"] = { percent: 60 };
rep.conditions.adhd.domains["Rejection sensitivity"] = { percent: 50 };
ok(someRec(recsFor(rep), "borderline / emotional-dysregulation differential"), "BPD co-elevation can come from rejection sensitivity");
rep = baseReport();
rep.conditions.adhd.domains["Emotional control"] = { percent: 80 };
ok(!someRec(recsFor(rep), "borderline / emotional-dysregulation differential"), "no BPD rec when BPD domain below 50");

// IAD direction gate: OCD health theme >=50 AND direction >=0.75
rep = baseReport();
rep.conditions.ocd.domains["Health/somatic reassurance"] = { percent: 50 };
rep.differential.directions.iad = 0.75;
ok(someRec(recsFor(rep), "illness anxiety disorder differential"), "IAD rec fires at OCD health 50 and direction 0.75");
rep = baseReport();
rep.conditions.ocd.domains["Health/somatic reassurance"] = { percent: 50 };
rep.differential.directions.iad = 0.5;
ok(!someRec(recsFor(rep), "illness anxiety disorder differential"), "IAD rec needs direction >= 0.75");
rep = baseReport();
rep.differential.directions.iad = 1;
ok(!someRec(recsFor(rep), "illness anxiety disorder differential"), "no IAD rec when OCD health theme below 50");

// Hoarding direction gate: OCD hoarding theme >=50 AND direction >=0.75
rep = baseReport();
rep.conditions.ocd.domains["Hoarding-like difficulty discarding"] = { percent: 50 };
rep.differential.directions.hoarding = 0.75;
ok(someRec(recsFor(rep), "hoarding disorder differential"), "hoarding rec fires at OCD hoarding 50 and direction 0.75");
rep = baseReport();
rep.conditions.ocd.domains["Hoarding-like difficulty discarding"] = { percent: 50 };
rep.differential.directions.hoarding = 0.5;
ok(!someRec(recsFor(rep), "hoarding disorder differential"), "hoarding rec needs direction >= 0.75");

// CDS discussion note at >=50
rep = baseReport(); rep.conditions.cds.percent = 50;
ok(someRec(recsFor(rep), "Discuss CDS traits as a non-DSM research construct"), "CDS discussion rec fires at 50");
rep = baseReport(); rep.conditions.cds.percent = 49;
ok(!someRec(recsFor(rep), "Discuss CDS traits as a non-DSM research construct"), "no CDS rec at 49");

// ---- 4j. Optional strengths module (buildStrengths) ----------------------
section("4j. Optional strengths module");
const strengthQs = [
  { id: "s1", condition: "strengths", domain: "a", type: "choice", label: "Alpha" },
  { id: "s2", condition: "strengths", domain: "b", type: "choice", label: "Beta" },
  { id: "s3", condition: "strengths", domain: "c", type: "choice", label: "Gamma" },
  { id: "x1", condition: "adhd", domain: "inattention", type: "scale" }, // non-strength, must be ignored
];
let sres = S.buildStrengths(strengthQs, {
  s1: { value: 4, label: "Very like me" },
  s2: { value: 3, label: "Quite like me" },
  s3: { value: 2, label: "Somewhat" },
  x1: { value: 4, label: "Very often" },
});
eq(sres.length, 2, "buildStrengths lists only items endorsed at >= 3");
eq(sres[0].label, "Alpha", "reported strength uses the item's report label");
eq(sres[0].level, "Very like me", "reported strength carries the endorsed answer label");
ok(!sres.some((s) => s.id === "s3"), "value 2 (Somewhat) is not reported");
ok(!sres.some((s) => s.id === "x1"), "a non-strengths condition never appears in strengths");
eq(S.buildStrengths(strengthQs, {}).length, 0, "no answers -> no reported strengths");
eq(S.buildStrengths([{ id: "s9", condition: "strengths", type: "choice", text: "Full text" }],
  { s9: { value: 3, label: "Quite like me" } })[0].label, "Full text", "label falls back to question text");

// Live bank: exactly 7 optional strengths items on the strengthDegree scale.
const liveStrengths = allQuestions().filter((q) => q.condition === "strengths");
eq(liveStrengths.length, 7, "bank has 7 strengths items");
ok(liveStrengths.every((q) => q.optional === true), "all strengths items are optional");
ok(liveStrengths.every((q) => q.choices === "strengthDegree"), "strengths use the strengthDegree choice scale");

// Invariant: strengths feed NO condition percentage. Same non-strengths answers,
// strengths all maxed vs all zero -> identical condition percents; only the
// reported-strengths list differs.
function reportWithStrengths(strengthValue) {
  const qs = allQuestions();
  const answers = {};
  qs.forEach((q) => {
    if (q.condition === "strengths") {
      answers[q.id] = { value: strengthValue, label: strengthValue >= 3 ? "Very like me" : "Not like me" };
    } else {
      const opts = q.type === "choice" ? CHOICES[q.choices] : SCALE;
      answers[q.id] = { value: opts[0].value, label: opts[0].label };
    }
  });
  return S.buildReport({ profile: {}, answers }, qs, bank.conditionLabels);
}
const rMax = reportWithStrengths(4);
const rMin = reportWithStrengths(0);
Object.keys(rMax.conditions).forEach((key) => {
  eq(rMax.conditions[key].percent, rMin.conditions[key].percent, `strengths do not change ${key} percent`);
});
eq(rMax.strengths.length, 7, "all strengths at Very like me -> all 7 reported");
eq(rMin.strengths.length, 0, "all strengths at Not like me -> none reported");
// Completion counts required only, so optional answers never inflate it.
eq(rMax.completion.total, 218, "completion total counts the 218 required items only");

// ---- 5. full-report golden baseline over the live bank -------------------
section("5. Full-report golden baseline (whole question bank)");
function allQuestions() {
  return bank.sections.flatMap((sec) =>
    sec.questions.map((question) => ({ ...question, section: sec.id, optional: Boolean(sec.optional) })));
}
// Per-id hash so each question's answer depends only on its own id. Adding
// unrelated questions to the bank therefore leaves existing answers (and the
// core condition scores below) unchanged — only newly added domains move.
function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function deterministicAnswers(questions) {
  const answers = {};
  questions.forEach((question) => {
    const opts = question.type === "choice" ? CHOICES[question.choices] : SCALE;
    const o = opts[hashId(question.id) % opts.length];
    answers[question.id] = { value: o.value, label: o.label };
  });
  return answers;
}
const questions = allQuestions();
const data = {
  profile: { clientName: "Test", clientAge: "30", reportDate: "2026-07-06", mainConcern: "" },
  answers: deterministicAnswers(questions),
};
const report = S.buildReport(data, questions, bank.conditionLabels);
const GOLDEN = {
  adhd: [52, "moderate"],
  asd: [48, "moderate"],
  audhd: [49, "moderate"],
  ocd: [60, "moderate"],
  cds: [68, "moderate"],
  anxiety: [61, "moderate"],
};
Object.entries(GOLDEN).forEach(([key, [percent, lvl]]) => {
  eq(report.conditions[key].percent, percent, `golden ${key} percent`);
  eq(report.conditions[key].level, lvl, `golden ${key} level`);
});
eq(report.differential.flags.length, 10, "golden differential flag count");
eq(report.validityFlags.length, 2, "golden validity flag count");
eq(questions.length, 225, "question bank has 225 items (218 required + 7 optional strengths)");
eq(questions.filter((q) => !q.optional).length, 218, "218 required (non-optional) items");
// Recommendations are now built in scoring.js and locked by the golden baseline.
eq(report.differential.priorityFlag, true, "golden priority-differential flag set");
eq(report.recommendations.length, 9, "golden recommendation count");
// First rec uses the conditionLabels mapping ("CDS"), not the condition's own
// long label ("Cognitive Disengagement Syndrome"): confirms labels thread through.
eq(report.recommendations[0], "Ask for formal assessment of CDS; screening match is 68%.", "golden first recommendation uses conditionLabels short form");
ok(report.recommendations.some((r) => r.startsWith("Discuss CDS traits as a non-DSM research construct")), "golden includes the CDS discussion recommendation");

// ---- 6. developmental-regression sensitivity ------------------------------
section("6. Developmental-regression sensitivity (informational-only invariant)");
function reportWithRegression(label, value) {
  const answers = { ...data.answers, "ctx-developmental-regression": { value, label } };
  return S.buildReport({ ...data, answers }, questions, bank.conditionLabels);
}
const regYes = reportWithRegression("Yes", 1);
const regNo = reportWithRegression("No", 0);
// The regression answer must not move the primary ASD percent: the item stays
// informational-only by decision, and this locks that in.
eq(regYes.conditions.asd.percent, regNo.conditions.asd.percent, "primary ASD percent identical for regression Yes vs No");
const sensYes = regYes.conditions.asd.regressionSensitivity;
const sensNo = regNo.conditions.asd.regressionSensitivity;
ok(sensYes.percentWithRegression >= sensNo.percentWithRegression, "sensitivity percent is monotonic in the regression answer");
// Max possible shift = regression's gate share x the gate's final share
// (0.06 x 0.17 = ~1 point), so the delta must stay tiny either way.
ok(Math.abs(sensYes.delta) <= 2, "sensitivity delta bounded for Yes");
ok(Math.abs(sensNo.delta) <= 2, "sensitivity delta bounded for No");
eq(sensYes.delta, sensYes.percentWithRegression - regYes.conditions.asd.percent, "delta equals counterfactual minus primary (Yes)");
eq(sensNo.delta, sensNo.percentWithRegression - regNo.conditions.asd.percent, "delta equals counterfactual minus primary (No)");
ok(regYes.conditions.asd.notes.some((n) => n.startsWith("Developmental-regression sensitivity:")), "sensitivity note present in ASD notes");
ok(regYes.conditions.asd.notes.some((n) => n.includes(`${sensYes.percentWithRegression}%`)), "sensitivity note carries the counterfactual percent");

// ---- 7. PDF layout helpers (pure) ----------------------------------------
section("7. PDF layout helpers (wrap + paginate)");
// Overlong unbroken token (a long URL) must be hard-split so no line exceeds
// maxChars — otherwise it runs off the printable width of the non-wrapping PDF.
const longUrl = "https://example.com/" + "a".repeat(200);
const wrappedUrl = P.wrapPdfText(longUrl, 88);
ok(wrappedUrl.every((l) => l.length <= 88), "wrapPdfText hard-splits an overlong token to <= maxChars");
eq(wrappedUrl.join(""), longUrl, "hard-split preserves every character of the token");
// Normal word wrapping still breaks only at whitespace, within maxChars.
const wrappedWords = P.wrapPdfText("alpha beta gamma delta epsilon", 11);
ok(wrappedWords.every((l) => l.length <= 11), "wrapPdfText wraps normal words within maxChars");
ok(wrappedWords.length > 1, "wrapPdfText splits a long sentence across lines");
eq(P.wrapPdfText("", 88).length, 1, "empty text yields a single (empty) line");
// A short real source line with a real URL wraps without overflow.
const srcLine = "VA National Center for PTSD: PTSD and DSM-5 - https://www.ptsd.va.gov/professional/treat/essentials/dsm5_ptsd.asp";
ok(P.wrapPdfText(srcLine, 88).every((l) => l.length <= 88), "a source bullet with a URL wraps within maxChars");

// Pagination splits long content across pages, and never places a line below
// the bottom margin (y >= 54).
const manyLines = [];
for (let i = 0; i < 100; i += 1) manyLines.push({ text: `line ${i}`, size: 10, spacingBefore: 2, spacingAfter: 2 });
const pages = P.paginatePdfLines(manyLines);
ok(pages.length >= 2, "paginatePdfLines splits 100 lines across multiple pages");
ok(pages.every((pg) => pg.every((ln) => ln.y >= 54)), "no paginated line sits below the bottom margin");
ok(manyLines.length === pages.reduce((n, pg) => n + pg.length, 0), "pagination preserves every line");

// keepWithNext: a subheading must not be orphaned at the foot of a page. With
// 41 filler lines the cursor sits where the heading alone would fit but the
// heading plus its body would not, so both must move to the next page together.
const orphanCase = [];
for (let i = 0; i < 41; i += 1) orphanCase.push({ text: `f${i}`, size: 10, spacingBefore: 2, spacingAfter: 2 });
orphanCase.push({ text: "Heading", size: 13, spacingBefore: 6, spacingAfter: 2, keepWithNext: true });
orphanCase.push({ text: "Body under heading", size: 10, spacingBefore: 2, spacingAfter: 2 });
const kept = P.paginatePdfLines(orphanCase);
const pageOf = (text) => kept.findIndex((pg) => pg.some((ln) => ln.text === text));
eq(pageOf("Heading"), pageOf("Body under heading"), "keepWithNext heading stays on the same page as its body");

// ---- 8. Question-bank structure invariants -------------------------------
section("8. Question-bank structure invariants");
const bankQuestions = allQuestions();

// Unique question ids across the whole bank.
const idCounts = {};
bankQuestions.forEach((q) => { idCounts[q.id] = (idCounts[q.id] || 0) + 1; });
const dupeIds = Object.keys(idCounts).filter((id) => idCounts[id] > 1);
eq(dupeIds.length, 0, `question ids are unique (dupes: ${JSON.stringify(dupeIds)})`);

// Only supported question types.
const SUPPORTED_TYPES = new Set(["scale", "choice"]);
const badTypes = bankQuestions.filter((q) => !SUPPORTED_TYPES.has(q.type)).map((q) => q.id);
eq(badTypes.length, 0, `every question uses a supported type (offenders: ${JSON.stringify(badTypes)})`);

// Required metadata: non-empty condition + domain strings on every item.
const KNOWN_CONDITIONS = new Set(["adhd", "anxiety", "asd", "cds", "context", "differential", "discriminator", "ocd", "strengths", "validity"]);
const missingCondition = bankQuestions.filter((q) => typeof q.condition !== "string" || !q.condition).map((q) => q.id);
const missingDomain = bankQuestions.filter((q) => typeof q.domain !== "string" || !q.domain).map((q) => q.id);
eq(missingCondition.length, 0, `every question has a condition (missing: ${JSON.stringify(missingCondition)})`);
eq(missingDomain.length, 0, `every question has a domain (missing: ${JSON.stringify(missingDomain)})`);
const unknownConditions = [...new Set(bankQuestions.map((q) => q.condition))].filter((c) => !KNOWN_CONDITIONS.has(c));
eq(unknownConditions.length, 0, `all conditions are known (unexpected: ${JSON.stringify(unknownConditions)})`);

// Choice-set references: choice questions must name a defined CHOICES set;
// scale questions must not carry a choices reference.
const badChoiceRef = bankQuestions.filter((q) => q.type === "choice" && !CHOICES[q.choices]).map((q) => q.id);
const scaleWithChoices = bankQuestions.filter((q) => q.type === "scale" && q.choices).map((q) => q.id);
eq(badChoiceRef.length, 0, `choice questions reference a defined choice set (bad: ${JSON.stringify(badChoiceRef)})`);
eq(scaleWithChoices.length, 0, `scale questions carry no choice reference (offenders: ${JSON.stringify(scaleWithChoices)})`);

// Unique numeric values within each choice set and the shared scale.
Object.entries(CHOICES).forEach(([name, options]) => {
  const values = options.map((o) => o.value);
  eq(new Set(values).size, values.length, `CHOICES.${name} has unique numeric values`);
  ok(options.every((o) => typeof o.value === "number" && typeof o.label === "string" && o.label), `CHOICES.${name} options are {number value, non-empty string label}`);
});
eq(new Set(SCALE.map((o) => o.value)).size, SCALE.length, "SCALE has unique numeric values");

// Exact required / optional / total counts, and optional == strengths.
eq(bankQuestions.length, 225, "bank has 225 items total");
eq(bankQuestions.filter((q) => !q.optional).length, 218, "218 required (non-optional) items");
eq(bankQuestions.filter((q) => q.optional).length, 7, "7 optional items");
const optionalNonStrength = bankQuestions.filter((q) => q.optional && q.condition !== "strengths").map((q) => q.id);
eq(optionalNonStrength.length, 0, `every optional item is a strengths item (offenders: ${JSON.stringify(optionalNonStrength)})`);

// Report-referenced differential domains must each resolve to >= 1 bank item,
// so a rename in questions.js that orphans a scored differential screen fails
// here (domainStats otherwise silently returns 0% for a missing domain).
const REFERENCED_DIFFERENTIAL_DOMAINS = [
  "sleepCircadian", "sleepBreathing", "mood", "burnout", "trauma", "ptsdComplex",
  "borderlinePattern", "substanceMedication", "medical", "mania", "psychosis",
  "learningLanguage", "riskSelf", "riskOther", "iadDirection", "hoardingDirection",
];
const domainSet = new Set(bankQuestions.map((q) => `${q.condition}:${q.domain}`));
REFERENCED_DIFFERENTIAL_DOMAINS.forEach((domain) => {
  ok(domainSet.has(`differential:${domain}`), `differential domain "${domain}" exists in the bank`);
});
// Each core scored condition contributes at least one bank item.
["adhd", "asd", "ocd", "cds", "anxiety"].forEach((condition) => {
  ok(bankQuestions.some((q) => q.condition === condition), `scored condition "${condition}" has >= 1 bank item`);
});

// ---- summary -------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
