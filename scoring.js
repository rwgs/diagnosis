// scoring.js — pure scoring core for the adult combined neurodevelopmental
// and anxiety screening report.
//
// This file has no DOM or browser dependencies. In the browser it is loaded as
// a classic <script> (before script.js) so its top-level function declarations
// become globals that script.js calls directly. In Node it is consumed by
// tests.js via module.exports (see the export block at the end of the file).
//
// Weight vectors live in WEIGHTS as a single source of truth: every non-trivial
// scoring formula reads its weights from here, and tests.js asserts that each
// vector sums to 1.00. Change a weight in one place and both the running app
// and the test harness see the same value.

const WEIGHTS = {
  // context.asdEarly composite (early-development autism markers)
  asdEarly: { social: 0.42, rrb: 0.34, communication: 0.24 },
  // ADHD DSM-style gate
  adhdGate: { childhood: 0.27, settings: 0.22, impairment: 0.24, adultImpact: 0.17, traitStability: 0.1 },
  // ADHD final screening percent (before additive discriminator bonus)
  adhdFinal: { symptomBase: 0.62, gate: 0.24, executive: 0.08, attentionVariability: 0.04, emotionalLability: 0.02 },
  // ASD DSM-style gate
  asdGate: { early: 0.32, impairment: 0.3, support: 0.28, traitStability: 0.1 },
  // ASD domain-coverage bonus (social vs restricted/repetitive)
  asdCoverage: { social: 0.55, rrb: 0.45 },
  // ASD final screening percent (before additive discriminator bonus)
  asdFinal: { social: 0.27, rrb: 0.23, gate: 0.17, coverage: 0.13, support: 0.1, extended: 0.1 },
  // AuDHD co-occurrence percent (min of the two conditions vs their mean)
  audhdFinal: { min: 0.7, mean: 0.3 },
  // OCD final screening percent
  ocdFinal: { core: 0.52, severity: 0.16, timeBurden: 0.16, impairment: 0.16 },
  // CDS final screening percent (before additive discriminator bonus)
  cdsFinal: { fog: 0.45, hypo: 0.38, withdrawal: 0.1, impairment: 0.07 },
  // Anxiety GAD-like composite
  anxietyGad: { worry: 0.38, symptoms: 0.26, iu: 0.1, duration: 0.13, impairment: 0.13 },
  // Anxiety social-anxiety pathway
  anxietySocial: { social: 0.72, impairment: 0.12, duration: 0.16 },
  // Anxiety panic/agoraphobic pathway
  anxietyPanic: { panic: 0.72, impairment: 0.12, duration: 0.16 },
  // ASD support-level sub-scores and their composite
  asdSupportSocial: { social: 0.42, support: 0.42, adaptive: 0.16 },
  asdSupportRrb: { rrb: 0.4, support: 0.45, impairment: 0.15 },
  asdSupportAdaptive: { adaptive: 0.55, supportNeed: 0.25, impairment: 0.2 },
  asdSupportComposite: { social: 0.36, rrb: 0.36, adaptive: 0.28 },
};

// Maximum absolute discriminator adjustment applied to each condition's final
// percent. tests.js asserts the bonus functions never move a score outside
// [-cap, +cap] across every combination of pattern-clarification answers.
const DISCRIMINATOR_CAPS = { adhd: 9, asd: 6, cds: 5 };

function scoreAdhd(questions, answers, context) {
  const inattentive = domainStats("adhd", "inattention", questions, answers);
  const hyper = domainStats("adhd", "hyperImpulsive", questions, answers);
  const executiveDomains = [
    ["Working memory", "workingMemory"],
    ["Time management", "timeManagement"],
    ["Task initiation", "taskInitiation"],
    ["Planning/prioritization", "planning"],
    ["Organization", "organization"],
    ["Flexibility/shifting", "flexibility"],
    ["Self-monitoring/metacognition", "selfMonitoring"],
    ["Emotional control", "emotionalControl"],
    ["Stress tolerance", "stressTolerance"],
    ["Behavioral regulation/inhibition", "behavioralRegulation"],
    ["Rejection sensitivity", "rejectionSensitivity"],
  ].map(([label, domain]) => [label, domainStats("adhd", domain, questions, answers)]);
  const executiveComposite = average(executiveDomains.map(([, stats]) => stats.percent));
  const impactDomains = [
    ["Work/education impairment", "workEducationImpairment"],
    ["Relationship impairment", "relationshipImpairment"],
    ["Daily-living impairment", "dailyLivingImpairment"],
  ].map(([label, domain]) => [label, domainStats("adhd", domain, questions, answers)]);
  const adultImpactComposite = average(impactDomains.map(([, stats]) => stats.percent));
  const attentionVariabilityDomains = [
    ["Vigilance under monotony", "vigilance"],
    ["Performance variability", "performanceVariability"],
    ["Processing-speed variability", "processingSpeedVariability"],
  ].map(([label, domain]) => [label, domainStats("adhd", domain, questions, answers)]);
  const attentionVariabilityComposite = average(attentionVariabilityDomains.map(([, stats]) => stats.percent));
  const emotionalLability = domainStats("adhd", "emotionalLability", questions, answers);
  const selfConcept = domainStats("adhd", "selfConcept", questions, answers);
  const hyperfocus = domainStats("adhd", "hyperfocus", questions, answers);
  // Either presentation can carry ADHD on its own (predominantly inattentive OR
  // hyperactive-impulsive), so the symptom base is the stronger of the two
  // domains. A mean term was dropped here: the arithmetic mean of two values can
  // never exceed their max, so Math.max(a, b, (a+b)/2) === Math.max(a, b).
  const symptomBase = Math.max(inattentive.percent, hyper.percent);
  const gate = weightedAverage([
    [context.adhdChildhood * 100, WEIGHTS.adhdGate.childhood],
    [context.settings * 100, WEIGHTS.adhdGate.settings],
    [context.impairment * 100, WEIGHTS.adhdGate.impairment],
    [adultImpactComposite, WEIGHTS.adhdGate.adultImpact],
    [context.traitStability, WEIGHTS.adhdGate.traitStability],
  ]);
  const discriminatorBonus = adhdDiscriminatorBonus(questions, answers);
  const percent = clamp(Math.round(symptomBase * WEIGHTS.adhdFinal.symptomBase + gate * WEIGHTS.adhdFinal.gate + executiveComposite * WEIGHTS.adhdFinal.executive + attentionVariabilityComposite * WEIGHTS.adhdFinal.attentionVariability + emotionalLability.percent * WEIGHTS.adhdFinal.emotionalLability + discriminatorBonus));

  let presentation = "Subthreshold or mixed traits";
  if (inattentive.countOften >= 5 && hyper.countOften >= 5) {
    presentation = "Combined presentation signal";
  } else if (inattentive.countOften >= 5) {
    presentation = "Predominantly inattentive presentation signal";
  } else if (hyper.countOften >= 5) {
    presentation = "Predominantly hyperactive-impulsive presentation signal";
  } else if (inattentive.percent >= 55 && hyper.percent >= 55) {
    presentation = "Broad ADHD traits below adult DSM-style symptom-count threshold";
  } else if (inattentive.percent >= hyper.percent + 12) {
    presentation = "Inattentive traits";
  } else if (hyper.percent >= inattentive.percent + 12) {
    presentation = "Hyperactive-impulsive traits";
  }

  return {
    key: "adhd",
    label: "ADHD",
    percent,
    level: level(percent),
    summary: presentation,
    // DSM-5 uses symptom counts, not percentages. Surfaced as structured data
    // so the report can show the count (items rated Often/Very often) against
    // the ~5-of-9 adult discussion threshold prominently, not buried in a note.
    symptomCounts: {
      inattentiveOften: inattentive.countOften,
      hyperOften: hyper.countOften,
      perDomain: 9,
      adultThreshold: 5,
    },
    domains: {
      "Inattention": inattentive,
      "Hyperactivity/impulsivity": hyper,
      "Hyperfocus/attentional absorption": hyperfocus,
      "Executive skills composite": { percent: executiveComposite },
      ...Object.fromEntries(executiveDomains),
      "DIVA-style adult impairment composite": { percent: adultImpactComposite },
      ...Object.fromEntries(impactDomains),
      "Conners-style attention variability composite": { percent: attentionVariabilityComposite },
      ...Object.fromEntries(attentionVariabilityDomains),
      "Emotional lability": emotionalLability,
      "ADHD self-concept impact": selfConcept,
      "DSM-style gates": { percent: gate },
    },
    notes: [
      `Childhood-onset support: inattentive ${gateLabel(context.adhdChildhoodInattentive)}, hyperactive/impulsive ${gateLabel(context.adhdChildhoodHyperImpulsive)}. Multiple settings: ${gateLabel(context.settings)}. Impairment: ${gateLabel(context.impairment)}.`,
      `DIVA-5-style lifetime context: adult symptoms are paired with split childhood-onset prompts, collateral-history availability ${gateLabel(context.collateralHistory)}, settings, global impairment, and adult impact domains using original wording.`,
      `Adult impact domains: work/education ${Math.round(impactDomains[0][1].percent)}%, relationships ${Math.round(impactDomains[1][1].percent)}%, daily living ${Math.round(impactDomains[2][1].percent)}%, self-concept ${Math.round(selfConcept.percent)}%.`,
      `ESQ-R-style executive profile: composite ${Math.round(executiveComposite)}%. Includes behavioral regulation/inhibition and rejection sensitivity alongside standard ESQ-R domains.`,
      `CAARS/Conners-style associated features: emotional lability ${Math.round(emotionalLability.percent)}%; attention variability ${Math.round(attentionVariabilityComposite)}%. These support formulation but are not DSM symptom-count criteria.`,
      `Hyperfocus score: ${Math.round(hyperfocus.percent)}%. Hyperfocus is an attentional dysregulation pattern, not a DSM criterion, but contributes to functional impairment in many adults with ADHD.`,
      `Trait stability: ${Math.round(context.traitStability)}% (continuous lifelong pattern vs. episodic). Discriminator adjustment to ADHD score: ${discriminatorBonus >= 0 ? "+" : ""}${Math.round(discriminatorBonus)} from pattern-clarification answers.`,
    ],
  };
}

function scoreAsd(questions, answers, context) {
  const socialDomains = [
    ["Social-emotional reciprocity", "socialReciprocity"],
    ["Nonverbal communication", "nonverbalCommunication"],
    ["Relationships", "relationships"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);

  const rrbDomains = [
    ["Repetitive behavior/speech", "repetitiveBehavior"],
    ["Sameness and transitions", "sameness"],
    ["Focused interests", "focusedInterests"],
    ["Sensory profile", "sensory"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);
  const extendedDomains = [
    ["Pragmatic language", "pragmaticLanguage"],
    ["Narrative/event description", "narrativePragmatics"],
    ["Idiosyncratic/private language", "idiosyncraticLanguage"],
    ["Humor/irony processing", "humorProcessing"],
    ["Attention to detail/systemizing", "attentionToDetail"],
    ["Imagination/abstraction", "imagination"],
    ["Social timing/exit cues", "socialTiming"],
    ["Real-time social insight", "socialInsight"],
    ["Camouflaging: compensation", "camouflageCompensation"],
    ["Camouflaging: masking", "camouflageMasking"],
    ["Camouflaging: assimilation", "camouflageAssimilation"],
    ["Cognitive empathy/mentalizing", "cognitiveEmpathy"],
    ["Empathic response expression", "empathicResponse"],
    ["Emotional reactivity", "emotionalReactivity"],
    ["Interoception", "interoception"],
    ["Motor coordination", "motorCoordination"],
    ["Alexithymia", "alexithymia"],
    ["Autistic burnout history", "autisticBurnout"],
    ["Interest content style", "interestContent"],
  ].map(([label, domain]) => [label, domainStats("asd", domain, questions, answers)]);
  const pragmaticLanguage = extendedDomains.find(([label]) => label === "Pragmatic language")[1];
  const narrativePragmatics = extendedDomains.find(([label]) => label === "Narrative/event description")[1];
  const idiosyncraticLanguage = extendedDomains.find(([label]) => label === "Idiosyncratic/private language")[1];
  const humorProcessing = extendedDomains.find(([label]) => label === "Humor/irony processing")[1];
  const attentionToDetail = extendedDomains.find(([label]) => label === "Attention to detail/systemizing")[1];
  const imagination = extendedDomains.find(([label]) => label === "Imagination/abstraction")[1];
  const socialTiming = extendedDomains.find(([label]) => label === "Social timing/exit cues")[1];
  const socialInsight = extendedDomains.find(([label]) => label === "Real-time social insight")[1];
  const alexithymia = extendedDomains.find(([label]) => label === "Alexithymia")[1];
  const autisticBurnout = extendedDomains.find(([label]) => label === "Autistic burnout history")[1];
  const motorCoordination = extendedDomains.find(([label]) => label === "Motor coordination")[1];
  const camouflageComposite = average(
    extendedDomains
      .filter(([label]) => label.startsWith("Camouflaging"))
      .map(([, stats]) => stats.percent),
  );
  const empathyComposite = average(
    extendedDomains
      .filter(([label]) => label.includes("empathy") || label.includes("Empathic") || label === "Emotional reactivity")
      .map(([, stats]) => stats.percent),
  );
  const supportSocial = domainStats("asd", "supportSocial", questions, answers);
  const supportRrb = domainStats("asd", "supportRrb", questions, answers);
  const adaptiveFunction = domainStats("asd", "adaptiveFunction", questions, answers);
  const supportComposite = average([context.supportNeed, supportSocial.percent, supportRrb.percent, adaptiveFunction.percent]);

  const socialAverage = average(socialDomains.map(([, stats]) => stats.percent));
  const rrbAverage = average(rrbDomains.map(([, stats]) => stats.percent));
  const extendedAverage = average([
    pragmaticLanguage.percent,
    narrativePragmatics.percent,
    idiosyncraticLanguage.percent,
    humorProcessing.percent,
    attentionToDetail.percent,
    imagination.percent,
    socialTiming.percent,
    socialInsight.percent,
    camouflageComposite,
    empathyComposite,
    alexithymia.percent,
  ]);
  const requiredSocial = socialDomains.filter(([, stats]) => stats.percent >= 50).length;
  const requiredRrb = rrbDomains.filter(([, stats]) => stats.percent >= 50).length;
  const gate = weightedAverage([
    [context.asdEarly * 100, WEIGHTS.asdGate.early],
    [context.impairment * 100, WEIGHTS.asdGate.impairment],
    [supportComposite, WEIGHTS.asdGate.support],
    [context.traitStability, WEIGHTS.asdGate.traitStability],
  ]);
  const coverageBonus = ((requiredSocial / 3) * WEIGHTS.asdCoverage.social + (Math.min(requiredRrb, 2) / 2) * WEIGHTS.asdCoverage.rrb) * 100;
  const discriminatorBonus = asdDiscriminatorBonus(questions, answers);
  const percent = clamp(Math.round(socialAverage * WEIGHTS.asdFinal.social + rrbAverage * WEIGHTS.asdFinal.rrb + gate * WEIGHTS.asdFinal.gate + coverageBonus * WEIGHTS.asdFinal.coverage + supportComposite * WEIGHTS.asdFinal.support + extendedAverage * WEIGHTS.asdFinal.extended + discriminatorBonus));
  const asperger = domainStats("asd", "aspergerProfile", questions, answers);
  const supportProfile = asdSupportProfile({
    percent,
    socialAverage,
    rrbAverage,
    supportSocial,
    supportRrb,
    adaptiveFunction,
    context,
  });

  return {
    key: "asd",
    label: "Autism Spectrum",
    percent,
    level: level(percent),
    summary: `${supportProfile.overall}; ${requiredSocial}/3 social-communication domains and ${requiredRrb}/4 restricted/repetitive domains are elevated.`,
    domains: Object.fromEntries([
      ...socialDomains,
      ...rrbDomains,
      ...extendedDomains,
      ["Camouflaging composite", { percent: camouflageComposite }],
      ["Empathy/mentalizing composite", { percent: empathyComposite }],
      ["Social support intensity", supportSocial],
      ["Routine/sensory support intensity", supportRrb],
      ["Adaptive daily-living support", adaptiveFunction],
      ["Support-level composite", { percent: supportProfile.composite }],
      ["Legacy Asperger's-style profile", asperger],
      ["DSM-style gates", { percent: gate }],
    ]),
    notes: [
      "Asperger's disorder is no longer a separate DSM diagnosis; a previous Asperger's-like profile is generally discussed as autism spectrum disorder, often with lower visible language support needs.",
      `Support-level discussion: social communication ${supportProfile.social}; restricted/repetitive and sensory patterns ${supportProfile.rrb}; adaptive daily living ${supportProfile.adaptive}.`,
      `Expanded ASD coverage includes ADOS/ADI/MIGDAS/RAADS/AQ/CAT-Q/EQ-style constructs using original wording: pragmatic language ${Math.round(pragmaticLanguage.percent)}%, narrative ${Math.round(narrativePragmatics.percent)}%, private/idiosyncratic language ${Math.round(idiosyncraticLanguage.percent)}%, humor ${Math.round(humorProcessing.percent)}%, camouflaging ${Math.round(camouflageComposite)}%, empathy/mentalizing ${Math.round(empathyComposite)}%.`,
      `MIGDAS-style adult profile additions: social exit/timing ${Math.round(socialTiming.percent)}%, real-time social insight ${Math.round(socialInsight.percent)}%, interoception ${Math.round(extendedDomains.find(([label]) => label === "Interoception")[1].percent)}%, motor coordination / body-in-space ${Math.round(motorCoordination.percent)}%, alexithymia ${Math.round(alexithymia.percent)}%.`,
      `Autistic burnout history: ${Math.round(autisticBurnout.percent)}%. Review alongside masking score, support level, and adaptive function; burnout can cause skill regression and is common in late-diagnosed adults.`,
      `Legacy Asperger's-style profile score: ${Math.round(asperger.percent)}%. Early-development support: social ${gateLabel(context.asdEarlySocial)}, restricted/repetitive or sensory ${gateLabel(context.asdEarlyRrb)}, early communication markers ${gateLabel(context.asdEarlyCommunicationMarkers)}. Developmental regression history: ${gateLabel(context.developmentalRegression)}. Masking score: ${Math.round(context.masking)}%.`,
      `Trait stability: ${Math.round(context.traitStability)}% (continuous lifelong pattern vs. episodic). Discriminator adjustment to ASD score: ${discriminatorBonus >= 0 ? "+" : ""}${Math.round(discriminatorBonus)} from pattern-clarification answers.`,
    ],
  };
}

function scoreAudhd(adhd, asd, context) {
  const percent = clamp(Math.round(Math.min(adhd.percent, asd.percent) * WEIGHTS.audhdFinal.min + average([adhd.percent, asd.percent]) * WEIGHTS.audhdFinal.mean));
  let summary = "Low co-occurrence signal";
  if (adhd.percent >= 65 && asd.percent >= 65) {
    summary = "Strong co-occurring ADHD + autism spectrum signal";
  } else if (adhd.percent >= 55 && asd.percent >= 55) {
    summary = "Moderate co-occurring ADHD + autism spectrum signal";
  } else if (adhd.percent >= 65 || asd.percent >= 65) {
    summary = "One condition is elevated; review overlap and differential explanations";
  }

  const patterns = detectAudhdPatterns(adhd, asd, context);
  const baseNotes = [
    "AuDHD is an informal term for co-occurring ADHD and autism spectrum disorder, not a separate DSM diagnosis.",
    "A clinician should evaluate both conditions directly because ADHD and autism can mask, mimic, or amplify each other. Specific interactions detected from this report are listed below.",
  ];

  const patternNotes = [];
  if (patterns.masking.length) {
    patternNotes.push(`Masking interactions: ${patterns.masking.join(" ")}`);
  }
  if (patterns.mimic.length) {
    patternNotes.push(`Mimicking interactions: ${patterns.mimic.join(" ")}`);
  }
  if (patterns.amplify.length) {
    patternNotes.push(`Amplifying interactions: ${patterns.amplify.join(" ")}`);
  }
  if (!patternNotes.length && (adhd.percent >= 45 && asd.percent >= 45)) {
    patternNotes.push("No specific masking, mimicking, or amplifying pattern crossed the detection threshold. Clinicians should still review overlap manually because subtle patterns can be missed by a self-report screener.");
  }

  return {
    key: "audhd",
    label: "AuDHD Co-occurrence",
    percent,
    level: level(percent),
    summary,
    domains: {
      ADHD: { percent: adhd.percent },
      "Autism Spectrum": { percent: asd.percent },
      // Detection flags, not severities: rendered as detected/not detected so a
      // clinician does not read a binary "present" as a 100% severity score.
      "Masking interactions": { detected: patterns.masking.length > 0 },
      "Mimicking interactions": { detected: patterns.mimic.length > 0 },
      "Amplifying interactions": { detected: patterns.amplify.length > 0 },
    },
    notes: [...baseNotes, ...patternNotes],
  };
}

function detectAudhdPatterns(adhd, asd, context) {
  const masking = [];
  const mimic = [];
  const amplify = [];

  if (adhd.percent < 45 || asd.percent < 45) {
    return { masking, mimic, amplify };
  }

  const a = (label) => Math.round(adhd.domains[label]?.percent ?? 0);
  const s = (label) => Math.round(asd.domains[label]?.percent ?? 0);
  const T = 55;

  // Masking patterns — one condition is hiding the other from external view.
  if (s("Sameness and transitions") >= T && a("Organization") >= T) {
    masking.push("Autistic routines and insistence on sameness may be compensating for ADHD disorganization; without those structures, ADHD impact would likely be greater.");
  }
  if (s("Focused interests") >= T && a("Hyperfocus/attentional absorption") >= T && a("Inattention") >= T) {
    masking.push("Intense focused interests can look like sustained attention while general ADHD inattention persists outside those interests.");
  }
  if (s("Camouflaging composite") >= T && adhd.percent >= 50) {
    masking.push("Heavy camouflaging may make both ADHD and autism look milder externally than they feel internally; ask about effort and recovery time, not only visible output.");
  }
  if (s("Adaptive daily-living support") >= T && context.supportNeed >= T) {
    masking.push("Existing supports, routines, or accommodations may make functional difficulties appear less severe than they would be without them.");
  }
  if (s("Camouflaging composite") >= T && a("Hyperactivity/impulsivity") >= T) {
    masking.push("Camouflaging effort may suppress visible hyperactivity or impulsivity in formal settings while it surfaces fully at home or after recovery time.");
  }

  // Mimicking patterns — one condition presents as if it were the other.
  if (s("Sensory profile") >= T && a("Inattention") >= T) {
    mimic.push("Sensory overload can present as ADHD distractibility; both should be reviewed because management strategies differ (reduce sensory load vs. attention scaffolding).");
  }
  if (s("Pragmatic language") >= T && a("Inattention") >= T) {
    mimic.push("Difficulty with implied meaning or fast group speech can present as attention drift; clarify whether the issue is language processing or attention shifting.");
  }
  if (a("Time management") >= T && s("Sameness and transitions") >= T) {
    mimic.push("Rigid time and routine reliance can develop as compensation for ADHD time blindness rather than reflecting autistic preference for sameness.");
  }
  if (s("Relationships") >= T && a("Task initiation") >= T) {
    mimic.push("Social recovery needs and ADHD task-initiation problems can both present as 'not getting started'; identify whether energy depletion or executive freeze is primary in a given moment.");
  }
  if (s("Interoception") >= T && a("Daily-living impairment") >= T) {
    mimic.push("Missed body signals (interoception) and ADHD daily-living lapses both produce skipped meals, hydration, and self-care; cause-finding determines whether the fix is body-awareness scaffolding or executive support.");
  }

  // Amplifying patterns — co-occurrence makes the combined effect larger than either alone.
  if (a("Hyperactivity/impulsivity") >= T && s("Pragmatic language") >= T) {
    amplify.push("Impulsive speech combined with literal interpretation can produce social misunderstandings beyond what either pattern alone would cause.");
  }
  if (a("Emotional control") >= T && s("Sensory profile") >= T) {
    amplify.push("Sensory overload and emotional dysregulation compound; meltdowns may be larger and recovery longer than either condition alone would predict.");
  }
  if (a("Rejection sensitivity") >= T && s("Camouflaging composite") >= T) {
    amplify.push("Rejection sensitivity combined with heavy masking can produce intense post-social shame, withdrawal, or autistic burnout episodes.");
  }
  if (a("ADHD self-concept impact") >= T && s("Camouflaging composite") >= T) {
    amplify.push("Years of masking plus ADHD-related self-criticism compound shame and burnout risk; address both together rather than treating one in isolation.");
  }
  if (a("Daily-living impairment") >= T && s("Adaptive daily-living support") >= T) {
    amplify.push("Daily-living difficulty is likely additive — ADHD task initiation/forgetfulness and autistic interoception/transition issues both contribute; plan supports for both.");
  }
  if (a("Hyperfocus/attentional absorption") >= T && s("Focused interests") >= T) {
    amplify.push("Combined ADHD hyperfocus and autistic focused interests can produce extreme absorption that overrides body needs, time, and competing obligations.");
  }
  if (s("Alexithymia") >= T && a("Emotional lability") >= T) {
    amplify.push("Difficulty identifying emotions plus rapid mood shifts means feelings often surface as behavior, sensory reactions, or somatic symptoms before being recognized.");
  }
  if (s("Autistic burnout history") >= T && a("ADHD self-concept impact") >= T) {
    amplify.push("Autistic burnout history alongside ADHD self-concept impact suggests a compounding cycle of overload, masking effort, and self-blame; recovery typically needs reduced demand and reframing of self-narrative.");
  }

  return { masking, mimic, amplify };
}

function scoreOcd(questions, answers, context) {
  const obsessions = domainStats("ocd", "obsessions", questions, answers);
  const compulsions = domainStats("ocd", "compulsions", questions, answers);
  const mentalCompulsions = domainStats("ocd", "mentalCompulsions", questions, answers);
  const avoidance = domainStats("ocd", "avoidance", questions, answers);
  const distressInterference = domainStats("ocd", "distressInterference", questions, answers);
  const controlResistance = domainStats("ocd", "controlResistance", questions, answers);
  const accommodation = domainStats("ocd", "accommodation", questions, answers);
  const timeBurden = choiceDomain("ocd", "timeBurden", questions, answers) * 100;
  const insight = choiceDomain("ocd", "insight", questions, answers) * 100;
  const tic = choiceDomain("ocd", "ticRelated", questions, answers);
  const core = average([obsessions.percent, compulsions.percent, mentalCompulsions.percent, avoidance.percent]);
  const severity = average([distressInterference.percent, controlResistance.percent, accommodation.percent]);
  const percent = clamp(Math.round(core * WEIGHTS.ocdFinal.core + severity * WEIGHTS.ocdFinal.severity + timeBurden * WEIGHTS.ocdFinal.timeBurden + context.impairment * 100 * WEIGHTS.ocdFinal.impairment));
  const themes = [
    ["Contamination/cleaning", "themeContamination"],
    ["Checking/responsibility/harm prevention", "themeChecking"],
    ["Symmetry/ordering/just-right", "themeSymmetry"],
    ["Taboo/intrusive thoughts", "themeIntrusive"],
    ["Health/somatic reassurance", "themeHealth"],
    ["Hoarding-like difficulty discarding", "themeHoarding"],
    ["Body-focused repetitive behaviors", "themeBfrb"],
  ]
    .map(([label, domain]) => [label, domainStats("ocd", domain, questions, answers)])
    .sort((a, b) => b[1].percent - a[1].percent);

  return {
    key: "ocd",
    label: "OCD",
    percent,
    level: level(percent),
    summary: ocdSummary(obsessions, compulsions, mentalCompulsions, timeBurden),
    domains: {
      Obsessions: obsessions,
      "Visible compulsions": compulsions,
      "Mental compulsions": mentalCompulsions,
      Avoidance: avoidance,
      "Distress/interference": distressInterference,
      "Control/resistance difficulty": controlResistance,
      "Family/partner accommodation": accommodation,
      "Time burden": { percent: timeBurden },
      Insight: { percent: insight },
      ...Object.fromEntries(themes),
    },
    notes: [
      `Insight while triggered: ${insightLabel(insight)}. Tic-related specifier discussion: ${tic >= 0.75 ? "yes/likely" : tic >= 0.4 ? "uncertain" : "not indicated"}.`,
      `Top themes: ${themes.slice(0, 3).map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`).join(", ")}.`,
    ],
  };
}

function scoreCds(questions, answers, context) {
  const fog = domainStats("cds", "cognitiveFog", questions, answers);
  const hypo = domainStats("cds", "hypoactivity", questions, answers);
  const withdrawal = domainStats("cds", "withdrawal", questions, answers);
  const discriminatorBonus = cdsDiscriminatorBonus(questions, answers);
  const percent = clamp(Math.round(fog.percent * WEIGHTS.cdsFinal.fog + hypo.percent * WEIGHTS.cdsFinal.hypo + withdrawal.percent * WEIGHTS.cdsFinal.withdrawal + context.impairment * 100 * WEIGHTS.cdsFinal.impairment + discriminatorBonus));
  let summary = "Low or nonspecific CDS signal";
  if (percent >= 65 && fog.percent >= hypo.percent + 12) summary = "Cognitive fog/daydreaming dominant CDS signal";
  else if (percent >= 65 && hypo.percent >= fog.percent + 12) summary = "Hypoactive/low-energy dominant CDS signal";
  else if (percent >= 65) summary = "Mixed cognitive disengagement and hypoactivity signal";
  else if (percent >= 45) summary = "Moderate CDS traits; compare with ADHD, sleep, depression, and medical factors";

  return {
    key: "cds",
    label: "Cognitive Disengagement Syndrome",
    percent,
    level: level(percent),
    summary,
    domains: {
      "Cognitive fog/daydreaming": fog,
      "Hypoactivity/low energy": hypo,
      Withdrawal: withdrawal,
    },
    notes: [
      "CDS is not a DSM diagnosis. Current research describes it as mental fogginess, excessive mind-wandering/daydreaming, slowed behavior or thinking, and reduced alertness.",
      "A clinician should rule out sleep disorders, depression, medication effects, substance effects, and medical conditions when CDS traits are high.",
      `Attention-drift quality discriminator adjustment to CDS score: ${discriminatorBonus >= 0 ? "+" : ""}${Math.round(discriminatorBonus)} points based on whether attention loss feels pulled-away (ADHD-PI direction) or drifted/disconnected (CDS direction).`,
    ],
  };
}

function scoreAnxiety(questions, answers, context) {
  const worry = domainStats("anxiety", "gadWorry", questions, answers);
  const symptoms = domainStats("anxiety", "gadSymptoms", questions, answers);
  const iu = domainStats("anxiety", "intoleranceOfUncertainty", questions, answers);
  const social = domainStats("anxiety", "socialAnxiety", questions, answers);
  const panic = domainStats("anxiety", "panic", questions, answers);
  const duration = choiceDomain("anxiety", "duration", questions, answers) * 100;
  const gadLike = clamp(Math.round(worry.percent * WEIGHTS.anxietyGad.worry + symptoms.percent * WEIGHTS.anxietyGad.symptoms + iu.percent * WEIGHTS.anxietyGad.iu + duration * WEIGHTS.anxietyGad.duration + context.impairment * 100 * WEIGHTS.anxietyGad.impairment));
  const percent = Math.max(gadLike, Math.round(social.percent * WEIGHTS.anxietySocial.social + context.impairment * 100 * WEIGHTS.anxietySocial.impairment + duration * WEIGHTS.anxietySocial.duration), Math.round(panic.percent * WEIGHTS.anxietyPanic.panic + context.impairment * 100 * WEIGHTS.anxietyPanic.impairment + duration * WEIGHTS.anxietyPanic.duration));
  const dominant = [
    ["GAD-like worry", { percent: gadLike }],
    ["Social anxiety", social],
    ["Panic/agoraphobic avoidance", panic],
  ].sort((a, b) => b[1].percent - a[1].percent);

  return {
    key: "anxiety",
    label: "Anxiety",
    percent,
    level: level(percent),
    summary: `${dominant[0][0]} is the strongest anxiety pattern.`,
    domains: {
      "Generalized worry": worry,
      "GAD physical/cognitive symptoms": symptoms,
      "Intolerance of uncertainty": iu,
      "GAD-like composite": { percent: gadLike },
      "Social anxiety": social,
      "Panic/agoraphobic avoidance": panic,
      "6+ month duration": { percent: duration },
    },
    notes: [
      `Top anxiety dimensions: ${dominant.map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`).join(", ")}.`,
      "Anxiety, OCD, ADHD, autism, sleep problems, trauma, depression, substances, and medical conditions can overlap and should be reviewed together.",
    ],
  };
}

function riskDeclined(domain, questions, answers) {
  // "Prefer not to say" on a safety item scores 3/4 (75%), which correctly
  // trips the conservative flag but must not be reported as an endorsement.
  // Detect the decline by the stored answer label, not the numeric value.
  const question = questions.find((q) => q.condition === "differential" && q.domain === domain);
  const answer = question && answers[question.id];
  return Boolean(answer && answer.label === "Prefer not to say");
}

function scoreDifferential(questions, answers) {
  const riskSelf = domainStats("differential", "riskSelf", questions, answers);
  const riskOther = domainStats("differential", "riskOther", questions, answers);
  riskSelf.declined = riskDeclined("riskSelf", questions, answers);
  riskOther.declined = riskDeclined("riskOther", questions, answers);
  const domains = {
    "Sleep/circadian disruption": domainStats("differential", "sleepCircadian", questions, answers),
    "Sleep apnea/daytime sleepiness": domainStats("differential", "sleepBreathing", questions, answers),
    "Mood/depression": domainStats("differential", "mood", questions, answers),
    Burnout: domainStats("differential", "burnout", questions, answers),
    "Trauma/stress/dissociation": domainStats("differential", "trauma", questions, answers),
    "PTSD/complex PTSD": domainStats("differential", "ptsdComplex", questions, answers),
    "Borderline / emotional dysregulation": domainStats("differential", "borderlinePattern", questions, answers),
    "Substance/medication effects": domainStats("differential", "substanceMedication", questions, answers),
    "Medical factors": domainStats("differential", "medical", questions, answers),
    "Mania/hypomania screen": domainStats("differential", "mania", questions, answers),
    "Psychosis-like experiences": domainStats("differential", "psychosis", questions, answers),
    "Learning/language/coordination history": domainStats("differential", "learningLanguage", questions, answers),
    "Current self-harm risk": riskSelf,
    "Current harm-to-others risk": riskOther,
    "Current safety risk": { percent: Math.max(riskSelf.percent, riskOther.percent) },
  };
  const flags = Object.entries(domains)
    .filter(([label]) => label !== "Current safety risk")
    .filter(([, stats]) => stats.percent >= 50)
    .map(([label, stats]) => (stats.declined ? `${label} (declined to answer)` : `${label} ${Math.round(stats.percent)}%`));

  // Directional discriminators (not symptom severities, so not flagged as
  // domains): they steer a differential recommendation only when the matching
  // OCD theme is elevated. Yes = 1 endorses the non-OCD direction, No = 0,
  // Unsure = 0.5; an unanswered item reads as 0.
  const directions = {
    iad: choiceDomain("differential", "iadDirection", questions, answers),
    hoarding: choiceDomain("differential", "hoardingDirection", questions, answers),
  };

  // Distinguish genuine endorsement from a declined ("Prefer not to say")
  // answer so the safety note reads accurately in a clinician-facing report.
  const endorsed = (riskSelf.percent >= 50 && !riskSelf.declined) || (riskOther.percent >= 50 && !riskOther.declined);
  const declined = riskSelf.declined || riskOther.declined;
  let note = null;
  if (endorsed && declined) {
    note = "Current self-harm or harm-related thoughts were endorsed at a clinically important level, and at least one current-risk question was declined ('Prefer not to say'). Seek urgent support now if there is any immediate risk, and a clinician should ask about current risk directly.";
  } else if (endorsed) {
    note = "Current self-harm or harm-related thoughts were endorsed at a clinically important level. Seek urgent support now if there is any immediate risk.";
  } else if (declined) {
    note = "One or both current-risk questions were declined ('Prefer not to say'). This is not an endorsement of risk, but a clinician should ask about self-harm and harm-to-others directly.";
  }
  const safety = { percent: domains["Current safety risk"].percent, endorsed, declined, note };

  // Precomputed priority-differential flag: elevated mania/hypomania or
  // psychosis-like experiences. Exposed as a boolean so the render layer and
  // buildRecommendations read it instead of the domain-label strings, which
  // would otherwise silently couple those callers to labels defined here.
  const priorityFlag =
    domains["Mania/hypomania screen"].percent >= 50 ||
    domains["Psychosis-like experiences"].percent >= 50;

  return { domains, flags, directions, safety, priorityFlag };
}

function readDiscriminator(domain, questions, answers) {
  const matched = questions.find((question) => question.condition === "discriminator" && question.domain === domain);
  if (!matched) return null;
  const answer = answers[matched.id];
  return answer ? answer.value : null;
}

function discriminatorContribution(value, fullA, fullB) {
  if (value === 1) return { a: fullA, b: -fullB };
  if (value === 0) return { a: -fullA, b: fullB };
  if (value === 0.5) return { a: fullA / 2, b: fullB / 2 };
  return { a: 0, b: 0 };
}

function adhdDiscriminatorBonus(questions, answers) {
  let bonus = 0;
  const drift = readDiscriminator("attentionDrift", questions, answers);
  const interest = readDiscriminator("interestDuration", questions, answers);
  const rigidity = readDiscriminator("rigidityAetiology", questions, answers);
  const stim = readDiscriminator("stimFunction", questions, answers);
  bonus += discriminatorContribution(drift, 3, 3).a;
  bonus += discriminatorContribution(interest, 2, 2).a;
  bonus += discriminatorContribution(rigidity, 2, 2).b;
  bonus += discriminatorContribution(stim, 2, 2).b;
  return bonus;
}

function asdDiscriminatorBonus(questions, answers) {
  let bonus = 0;
  const interest = readDiscriminator("interestDuration", questions, answers);
  const rigidity = readDiscriminator("rigidityAetiology", questions, answers);
  const stim = readDiscriminator("stimFunction", questions, answers);
  bonus += discriminatorContribution(interest, 2, 2).b;
  bonus += discriminatorContribution(rigidity, 2, 2).a;
  bonus += discriminatorContribution(stim, 2, 2).a;
  return bonus;
}

function cdsDiscriminatorBonus(questions, answers) {
  const drift = readDiscriminator("attentionDrift", questions, answers);
  return discriminatorContribution(drift, 3, 5).b;
}

function computeValidityFlags(questions, answers, conditions) {
  const flags = [];
  const get = (id) => answers[id]?.value;

  const reverseInatt = get("val-reverse-inatt");
  if (reverseInatt !== undefined && conditions.adhd?.domains?.["Inattention"]) {
    const inattScore = conditions.adhd.domains["Inattention"].percent;
    const reverseScore = (reverseInatt / 4) * 100;
    if (reverseScore >= 70 && inattScore >= 70) {
      flags.push("Inattention check: respondent reports both strong attention difficulties and easy multi-step task tracking. Inattention-area scoring may reflect inconsistent or careless responding.");
    } else if (reverseScore <= 25 && inattScore <= 25) {
      flags.push("Inattention check: respondent reports both no attention difficulties and inability to keep multi-step plans in mind. Verify response pattern.");
    }
  }

  const reverseSocial = get("val-reverse-social");
  if (reverseSocial !== undefined && conditions.asd?.domains?.["Nonverbal communication"]) {
    const nvcScore = conditions.asd.domains["Nonverbal communication"].percent;
    const reverseScore = (reverseSocial / 4) * 100;
    if (reverseScore >= 70 && nvcScore >= 70) {
      flags.push("Social-communication check: respondent reports both substantial difficulty reading nonverbal cues and easy automatic reading of expressions/tone. Verify response pattern.");
    } else if (reverseScore <= 25 && nvcScore <= 25) {
      flags.push("Social-communication check: respondent reports both little nonverbal-cue difficulty and difficulty automatically reading expressions/tone. Verify response pattern.");
    }
  }

  const reverseEmotion = get("val-reverse-emotion");
  if (reverseEmotion !== undefined && conditions.adhd?.domains?.["Emotional control"]) {
    const emoScore = conditions.adhd.domains["Emotional control"].percent;
    const reverseScore = (reverseEmotion / 4) * 100;
    if (reverseScore >= 70 && emoScore >= 70) {
      flags.push("Emotional-regulation check: respondent reports both strong emotional dysregulation and quick easy return to calm. Verify response pattern.");
    } else if (reverseScore <= 25 && emoScore <= 25) {
      flags.push("Emotional-regulation check: respondent reports both little emotional-control difficulty and difficulty returning to calm. Verify response pattern.");
    }
  }

  const infrequency = get("val-infrequency");
  if (infrequency !== undefined && infrequency >= 0.75) {
    flags.push("Infrequency check: respondent endorsed 'never felt distracted in life.' This statement is implausibly rare; endorsement may indicate careless or response-set responding.");
  }

  const consistObjects = get("val-consist-objects");
  const adhdI7 = get("adhd-i7");
  if (consistObjects !== undefined && adhdI7 !== undefined && Math.abs(consistObjects - adhdI7) >= 2) {
    flags.push("Consistency check: two near-equivalent items about losing daily objects were answered with substantially different frequencies. Verify response pattern.");
  }

  const consistMentalize = get("val-consist-mentalize");
  const asdC13 = get("asd-c13");
  if (consistMentalize !== undefined && asdC13 !== undefined && Math.abs(consistMentalize - asdC13) >= 2) {
    flags.push("Consistency check: two near-equivalent items about reading others' thoughts/feelings were answered with substantially different frequencies. Verify response pattern.");
  }

  return flags;
}

function domainStats(condition, domain, questions, answers) {
  const matched = questions.filter((question) => question.condition === condition && question.domain === domain);
  if (!matched.length) return { percent: 0, average: 0, peak: 0, countOften: 0, answered: 0, total: 0 };
  const values = matched.map((question) => answers[question.id]?.value ?? 0);
  const answered = matched.filter((question) => answers[question.id]).length;
  const averageValue = average(values);
  return {
    percent: clamp(Math.round((averageValue / 4) * 100)),
    average: averageValue,
    // Highest single-item score in the domain, as a percent. Exposed alongside
    // the average so a domain that is uniformly "Often" can be told apart from
    // one that mixes "Very often" with milder answers at the same average.
    peak: clamp(Math.round((Math.max(...values) / 4) * 100)),
    countOften: values.filter((item) => item >= 3).length,
    answered,
    total: matched.length,
  };
}

function domainAverage(condition, domain, questions, answers) {
  return domainStats(condition, domain, questions, answers).percent;
}

function choiceDomain(condition, domain, questions, answers) {
  const matched = questions.filter((question) => question.condition === condition && question.domain === domain);
  if (!matched.length) return 0;
  return average(matched.map((question) => answers[question.id]?.value ?? 0));
}

function completionStats(questions, answers) {
  const total = questions.length;
  const answered = questions.filter((question) => answers[question.id]).length;
  const percent = total ? Math.round((answered / total) * 100) : 0;
  return { total, answered, percent };
}

function ocdSummary(obsessions, compulsions, mentalCompulsions, timeBurden) {
  if (obsessions.percent >= 55 && Math.max(compulsions.percent, mentalCompulsions.percent) >= 55 && timeBurden >= 35) {
    return "Obsessions with compulsions/mental rituals and meaningful time burden";
  }
  if (obsessions.percent >= 55 && mentalCompulsions.percent >= compulsions.percent + 15) {
    return "Obsessions with primarily mental rituals/reassurance pattern";
  }
  if (compulsions.percent >= 55) {
    return "Compulsion/ritual-heavy pattern";
  }
  if (obsessions.percent >= 45) {
    return "Intrusive-thought traits; review anxiety, trauma, depression, and autism overlap";
  }
  return "Low or nonspecific OCD signal";
}

function asdSupportProfile({ percent, socialAverage, rrbAverage, supportSocial, supportRrb, adaptiveFunction, context }) {
  if (percent < 45) {
    return {
      overall: "Low or nonspecific autism-spectrum support-level signal",
      social: "not enough signal for a level discussion",
      rrb: "not enough signal for a level discussion",
      adaptive: "not enough signal for a level discussion",
      composite: 0,
    };
  }

  const socialNeed = weightedAverage([
    [socialAverage, WEIGHTS.asdSupportSocial.social],
    [supportSocial.percent, WEIGHTS.asdSupportSocial.support],
    [adaptiveFunction.percent, WEIGHTS.asdSupportSocial.adaptive],
  ]);
  const rrbNeed = weightedAverage([
    [rrbAverage, WEIGHTS.asdSupportRrb.rrb],
    [supportRrb.percent, WEIGHTS.asdSupportRrb.support],
    [context.impairment * 100, WEIGHTS.asdSupportRrb.impairment],
  ]);
  const adaptiveNeed = weightedAverage([
    [adaptiveFunction.percent, WEIGHTS.asdSupportAdaptive.adaptive],
    [context.supportNeed, WEIGHTS.asdSupportAdaptive.supportNeed],
    [context.impairment * 100, WEIGHTS.asdSupportAdaptive.impairment],
  ]);
  const composite = clamp(Math.round(weightedAverage([
    [socialNeed, WEIGHTS.asdSupportComposite.social],
    [rrbNeed, WEIGHTS.asdSupportComposite.rrb],
    [adaptiveNeed, WEIGHTS.asdSupportComposite.adaptive],
  ])));

  return {
    overall: `${supportLevelLabel(composite)} support-needs discussion; DSM autism levels require clinician judgment`,
    social: supportLevelLabel(socialNeed),
    rrb: supportLevelLabel(rrbNeed),
    adaptive: supportLevelLabel(adaptiveNeed),
    composite,
  };
}

function supportLevelLabel(score) {
  if (score >= 82) return "Level 3-style / very substantial support";
  if (score >= 62) return "Level 2-style / substantial support";
  if (score >= 42) return "Level 1-style / support";
  return "below Level 1-style support threshold";
}

function level(percent) {
  if (percent >= 70) return "high";
  if (percent >= 45) return "moderate";
  return "low";
}

function gateLabel(value) {
  if (value >= 0.8) return "yes/strong";
  if (value >= 0.45) return "partial/unsure";
  if (value > 0) return "limited";
  return "not endorsed";
}

function insightLabel(value) {
  if (value >= 75) return "absent insight or delusional-level conviction while triggered";
  if (value >= 50) return "poor insight while triggered";
  if (value >= 25) return "fair or variable insight";
  return "good/fair insight";
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weightedAverage(items) {
  const totalWeight = items.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return 0;
  return items.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function clamp(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function buildContext(questions, answers) {
  const profileValue = (domain) => domainAverage("context", domain, questions, answers);
  const adhdChildhoodInattentive = choiceDomain("context", "adhdChildhoodInattentive", questions, answers);
  const adhdChildhoodHyperImpulsive = choiceDomain("context", "adhdChildhoodHyperImpulsive", questions, answers);
  const asdEarlySocial = choiceDomain("context", "asdEarlySocial", questions, answers);
  const asdEarlyRrb = choiceDomain("context", "asdEarlyRrb", questions, answers);
  const asdEarlyRequesting = choiceDomain("context", "asdEarlyRequesting", questions, answers);
  const asdEarlyJointAttention = choiceDomain("context", "asdEarlyJointAttention", questions, answers);
  const asdEarlyLanguageMarkers = choiceDomain("context", "asdEarlyLanguageMarkers", questions, answers);
  const asdEarlyCommunicationMarkers = average([asdEarlyRequesting, asdEarlyJointAttention, asdEarlyLanguageMarkers]);

  const context = {
    adhdChildhoodInattentive,
    adhdChildhoodHyperImpulsive,
    adhdChildhood: Math.max(adhdChildhoodInattentive, adhdChildhoodHyperImpulsive),
    asdEarlySocial,
    asdEarlyRrb,
    asdEarlyRequesting,
    asdEarlyJointAttention,
    asdEarlyLanguageMarkers,
    asdEarlyCommunicationMarkers,
    asdEarly: weightedAverage([
      [asdEarlySocial, WEIGHTS.asdEarly.social],
      [asdEarlyRrb, WEIGHTS.asdEarly.rrb],
      [asdEarlyCommunicationMarkers, WEIGHTS.asdEarly.communication],
    ]),
    developmentalRegression: choiceDomain("context", "developmentalRegression", questions, answers),
    collateralHistory: choiceDomain("context", "collateralHistory", questions, answers),
    settings: choiceDomain("context", "settings", questions, answers),
    impairment: choiceDomain("context", "globalImpairment", questions, answers),
    masking: profileValue("masking"),
    literalInterpretation: profileValue("literalInterpretation"),
    supportNeed: profileValue("supportNeed"),
    lifetimeContinuity: profileValue("lifetimeContinuity"),
    symptomFreeIntervals: profileValue("symptomFreeIntervals"),
  };
  context.traitStability = clamp((context.lifetimeContinuity + (100 - context.symptomFreeIntervals)) / 2);
  return context;
}

// Pure clinical-discussion-point generator. A function of the report only (no
// DOM), so it lives here with the rest of the scoring core and is exercised by
// tests.js rather than sitting untested in the render layer. buildReport()
// attaches its output as report.recommendations; script.js only renders that.
// `conditionLabels` maps condition keys to display labels (e.g. cds -> "CDS");
// when omitted, each condition's own label is used. Domain reads are guarded so
// a renamed label degrades to "not elevated" instead of throwing at report time.
function buildRecommendations(report, conditionLabels = {}) {
  const { conditions, context, differential } = report;
  const recs = [];
  const domainPercent = (map, label) => map[label]?.percent ?? 0;

  Object.values(conditions)
    .filter((condition) => condition.percent >= 60)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      recs.push(`Ask for formal assessment of ${conditionLabels[condition.key] || condition.label}; screening match is ${Math.round(condition.percent)}%.`);
    });

  if (conditions.adhd.percent >= 55 && conditions.asd.percent >= 55) {
    recs.push("Ask the clinician to evaluate ADHD and autism together, because either condition can change how the other appears in adults.");
  }

  if (context.literalInterpretation >= 50 || context.masking >= 50) {
    recs.push("Tell the clinician that literal interpretation, masking, rehearsing, or compensatory strategies may affect standard questionnaire answers.");
  }

  if (differential.flags.length) {
    recs.push(`Review differential factors: ${differential.flags.join("; ")}.`);
  }

  if (differential.priorityFlag) {
    recs.push("Prioritize clinical review of mania/hypomania or psychosis-like experiences before interpreting ADHD, anxiety, OCD, or autism screening scores.");
  }

  if (domainPercent(differential.domains, "PTSD/complex PTSD") >= 50) {
    recs.push("Consider a PTSD or complex-PTSD differential alongside the ADHD and autism review; trauma responses can mimic ADHD hyperarousal, autistic withdrawal or dissociation, and CDS-style numbing.");
  }

  const adhdEmotionDysregulation = Math.max(
    domainPercent(conditions.adhd.domains, "Emotional lability"),
    domainPercent(conditions.adhd.domains, "Rejection sensitivity"),
    domainPercent(conditions.adhd.domains, "Emotional control"),
  );
  if (domainPercent(differential.domains, "Borderline / emotional dysregulation") >= 50 && adhdEmotionDysregulation >= 50) {
    recs.push("Consider a borderline / emotional-dysregulation differential alongside ADHD: elevated ADHD emotional lability and rejection sensitivity overlap with BPD affective instability and fear of abandonment. Ask the clinician to distinguish them using identity stability, idealisation–devaluation swings, and chronic emptiness, which point toward BPD rather than ADHD.");
  }

  if (domainPercent(conditions.ocd.domains, "Health/somatic reassurance") >= 50 && (differential.directions?.iad ?? 0) >= 0.75) {
    recs.push("Consider an illness anxiety disorder differential: health-related worry is elevated and centres on the possibility of having a serious disease itself rather than on contamination, rituals, or neutralising a feared outcome, which points toward illness anxiety disorder rather than OCD.");
  }

  if (domainPercent(conditions.ocd.domains, "Hoarding-like difficulty discarding") >= 50 && (differential.directions?.hoarding ?? 0) >= 0.75) {
    recs.push("Consider a hoarding disorder differential: difficulty discarding is elevated and driven mainly by genuine attachment or distress at loss rather than by contamination, exactness, or avoiding a feared consequence, which points toward hoarding disorder rather than OCD.");
  }

  if (conditions.cds.percent >= 50) {
    recs.push("Discuss CDS traits as a non-DSM research construct and ask about sleep, fatigue, mood, medical, medication, and ADHD overlap.");
  }

  if (!recs.length) {
    recs.push("Scores are mostly low. If distress or impairment is still significant, bring examples of real-life problems to a clinician because screeners can miss context.");
  }

  return recs;
}

// Optional, unscored strengths self-report. Surfaced in the report as a plain
// "Reported strengths" list to improve disclosure quality and counterbalance the
// deficit-only framing — it feeds no condition percentage. Lists the strengths
// endorsed at "Quite like me" or "Very like me" (value >= 3); items left low or
// unanswered are omitted so the list reflects what the respondent identifies with.
function buildStrengths(questions, answers) {
  return questions
    .filter((question) => question.condition === "strengths")
    .map((question) => ({ question, answer: answers[question.id] }))
    .filter(({ answer }) => answer && answer.value >= 3)
    .map(({ question, answer }) => ({
      id: question.id,
      label: question.label || question.text,
      level: answer.label,
    }));
}

// Pure report builder. `data` is { profile, answers } as produced by getAnswers()
// in script.js; `questions` is the flattened question bank from allQuestions().
// `conditionLabels` (from window.SCREENING_QUESTION_DATA) is threaded through to
// buildRecommendations. script.js's scoreAssessment() is a thin DOM wrapper.
function buildReport(data, questions, conditionLabels = {}) {
  const answers = data.answers;
  const context = buildContext(questions, answers);

  const adhd = scoreAdhd(questions, answers, context);
  const asd = scoreAsd(questions, answers, context);
  const ocd = scoreOcd(questions, answers, context);
  const cds = scoreCds(questions, answers, context);
  const anxiety = scoreAnxiety(questions, answers, context);
  const differential = scoreDifferential(questions, answers);
  const audhd = scoreAudhd(adhd, asd, context);

  // Completion counts only required questions. Optional items (the strengths
  // section, condition "strengths") never gate a report, so folding them into
  // the denominator would make a complete required set read as incomplete.
  const completion = completionStats(questions.filter((question) => !question.optional && question.condition !== "strengths"), answers);
  const validityFlags = computeValidityFlags(questions, answers, { adhd, asd, ocd, cds, anxiety });
  const strengths = buildStrengths(questions, answers);

  const report = {
    data,
    context,
    completion,
    conditions: { adhd, asd, audhd, ocd, cds, anxiety },
    differential,
    validityFlags,
    strengths,
  };
  report.recommendations = buildRecommendations(report, conditionLabels);
  return report;
}

// Dual export: browser classic-script globals are already visible to script.js;
// Node consumers (tests.js) get the same functions via module.exports.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    WEIGHTS,
    DISCRIMINATOR_CAPS,
    average,
    weightedAverage,
    clamp,
    domainStats,
    domainAverage,
    choiceDomain,
    completionStats,
    readDiscriminator,
    discriminatorContribution,
    adhdDiscriminatorBonus,
    asdDiscriminatorBonus,
    cdsDiscriminatorBonus,
    computeValidityFlags,
    level,
    gateLabel,
    insightLabel,
    supportLevelLabel,
    ocdSummary,
    asdSupportProfile,
    scoreAdhd,
    scoreAsd,
    scoreAudhd,
    detectAudhdPatterns,
    scoreOcd,
    scoreCds,
    scoreAnxiety,
    scoreDifferential,
    buildRecommendations,
    buildStrengths,
    buildContext,
    buildReport,
  };
}
