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

const path = require("path");

// The live question bank assigns to a browser global; shim it for Node.
global.window = {};
require(path.join(__dirname, "questions.js"));
const bank = global.window.SCREENING_QUESTION_DATA;
const { SCALE, CHOICES } = bank;

const S = require(path.join(__dirname, "scoring.js"));

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

// ---- 4c. PTSD / complex-PTSD differential domain -------------------------
section("4c. PTSD differential domain (ptsdComplex)");
const ptsdQuestions = ["intrusion", "avoidance", "cognition", "arousal", "dissociation"].map((k) => ({
  id: `diff-ptsd-${k}`, condition: "differential", domain: "ptsdComplex", type: "scale",
}));
function ptsdDifferential(value) {
  const answers = {};
  ptsdQuestions.forEach((q) => { answers[q.id] = { value }; });
  return S.scoreDifferential(ptsdQuestions, answers);
}
const ptsdHigh = ptsdDifferential(4);
eq(ptsdHigh.domains["PTSD/complex PTSD"].percent, 100, "all-4 PTSD items => 100%");
ok(ptsdHigh.flags.some((f) => f.startsWith("PTSD/complex PTSD")), "elevated PTSD raises a differential flag");
const ptsdMid = ptsdDifferential(2);
eq(ptsdMid.domains["PTSD/complex PTSD"].percent, 50, "all-2 PTSD items => 50%");
ok(ptsdMid.flags.some((f) => f.startsWith("PTSD/complex PTSD")), "PTSD flags at exactly 50%");
const ptsdLow = ptsdDifferential(0);
eq(ptsdLow.domains["PTSD/complex PTSD"].percent, 0, "all-0 PTSD items => 0%");
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

// ---- 5. full-report golden baseline over the live bank -------------------
section("5. Full-report golden baseline (whole question bank)");
function allQuestions() {
  return bank.sections.flatMap((sec) =>
    sec.questions.map((question) => ({ ...question, section: sec.id })));
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
const report = S.buildReport(data, questions);
const GOLDEN = {
  adhd: [52, "moderate"],
  asd: [50, "moderate"],
  audhd: [50, "moderate"],
  ocd: [60, "moderate"],
  cds: [62, "moderate"],
  anxiety: [59, "moderate"],
};
Object.entries(GOLDEN).forEach(([key, [percent, lvl]]) => {
  eq(report.conditions[key].percent, percent, `golden ${key} percent`);
  eq(report.conditions[key].level, lvl, `golden ${key} level`);
});
eq(report.differential.flags.length, 10, "golden differential flag count");
eq(report.validityFlags.length, 2, "golden validity flag count");
eq(questions.length, 228, "question bank has 228 items");

// ---- summary -------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
