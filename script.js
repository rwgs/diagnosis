const STORAGE_KEY = "adult-combined-screening-v1";
const { SCALE, CHOICES, DISPLAY_CHUNK_SIZE, sections, conditionLabels } = window.SCREENING_QUESTION_DATA;

let missingRepairActive = false;
let currentMissingQuestionId = null;

function allQuestions() {
  return sections.flatMap((section) => section.questions.map((question) => ({ ...question, section: section.id })));
}

function displayQuestionGroups() {
  const queues = sections.map((section) => section.questions.map((question) => ({ ...question, sourceSection: section.id })));
  const mixed = [];
  let hasQuestions = true;

  while (hasQuestions) {
    hasQuestions = false;
    queues.forEach((queue) => {
      const next = queue.shift();
      if (next) {
        mixed.push(next);
        hasQuestions = true;
      }
    });
  }

  const groups = [];
  for (let index = 0; index < mixed.length; index += DISPLAY_CHUNK_SIZE) {
    const questions = mixed.slice(index, index + DISPLAY_CHUNK_SIZE);
    const start = index + 1;
    const end = index + questions.length;
    groups.push({
      id: `part-${groups.length + 1}`,
      title: `Part ${groups.length + 1}`,
      note: `Mixed questions ${start}-${end} of ${mixed.length}. Answer based on the last 6 months unless the question asks about earlier life.`,
      questions,
      offset: index,
    });
  }
  return groups;
}

function byId(id) {
  return document.getElementById(id);
}

function renderQuestionnaire() {
  const container = byId("questionnaire");
  const sectionTemplate = byId("sectionTemplate");
  const scaleTemplate = byId("scaleQuestionTemplate");
  const choiceTemplate = byId("choiceQuestionTemplate");

  displayQuestionGroups().forEach((section) => {
    const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
    sectionNode.id = section.id;
    sectionNode.querySelector("legend").textContent = section.title;
    sectionNode.querySelector(".section-note").textContent = section.note;
    const list = sectionNode.querySelector(".question-list");

    section.questions.forEach((question, questionIndex) => {
      const template = question.type === "choice" ? choiceTemplate : scaleTemplate;
      const row = template.content.firstElementChild.cloneNode(true);
      const number = `Q${section.offset + questionIndex + 1}`;
      row.dataset.questionId = question.id;
      row.querySelector(".question-code").textContent = number;
      row.querySelector(".question-copy").textContent = question.text;
      row.querySelector(".question-help").textContent = helpText(question);

      const optionContainer = row.querySelector(question.type === "choice" ? ".choice-options" : ".scale-options");
      const options = question.type === "choice" ? CHOICES[question.choices] : SCALE;
      options.forEach((option) => {
        const label = document.createElement("label");
        label.className = "option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option.value;
        input.dataset.label = option.label;
        const span = document.createElement("span");
        const optionTitle = document.createElement("strong");
        optionTitle.className = "option-title";
        optionTitle.textContent = option.label;
        span.append(optionTitle);
        if (option.detail) {
          const optionDetail = document.createElement("small");
          optionDetail.className = "option-detail";
          optionDetail.textContent = option.detail;
          span.append(optionDetail);
        }
        label.append(input, span);
        optionContainer.append(label);
      });

      list.append(row);
    });

    container.append(sectionNode);
  });
}

function helpText(question) {
  if (question.type === "choice") {
    return "Choose the closest option.";
  }
  return "Use the frequency definitions in the answer buttons; count effort and compensation too.";
}

function getAnswers() {
  const data = {
    profile: {
      clientName: byId("clientName").value.trim(),
      clientAge: byId("clientAge").value.trim(),
      reportDate: byId("reportDate").value,
      mainConcern: byId("mainConcern").value.trim(),
    },
    answers: {},
  };

  allQuestions().forEach((question) => {
    const checked = document.querySelector(`input[name="${question.id}"]:checked`);
    if (checked) {
      data.answers[question.id] = {
        value: Number(checked.value),
        label: checked.dataset.label,
      };
    }
  });

  return data;
}

function saveAnswers() {
  const data = getAnswers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  byId("saveState").textContent = "Saved locally in this browser.";
  updateProgress();
}

function restoreAnswers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    Object.entries(data.profile || {}).forEach(([key, value]) => {
      const field = byId(key);
      if (field) field.value = value;
    });

    Object.entries(data.answers || {}).forEach(([id, answer]) => {
      const input = document.querySelector(`input[name="${id}"][value="${answer.value}"]`);
      if (input) input.checked = true;
    });

    byId("saveState").textContent = "Restored local answers.";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function scoreAssessment() {
  const data = getAnswers();
  const questions = allQuestions();
  const answers = data.answers;
  const value = (id) => answers[id]?.value ?? 0;
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
      [asdEarlySocial, 0.42],
      [asdEarlyRrb, 0.34],
      [asdEarlyCommunicationMarkers, 0.24],
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

  const adhd = scoreAdhd(questions, answers, context);
  const asd = scoreAsd(questions, answers, context);
  const ocd = scoreOcd(questions, answers, context);
  const cds = scoreCds(questions, answers, context);
  const anxiety = scoreAnxiety(questions, answers, context);
  const differential = scoreDifferential(questions, answers);
  const audhd = scoreAudhd(adhd, asd, context);

  const completion = completionStats(questions, answers);
  const validityFlags = computeValidityFlags(questions, answers, { adhd, asd, ocd, cds, anxiety });

  return {
    data,
    context,
    completion,
    conditions: { adhd, asd, audhd, ocd, cds, anxiety },
    differential,
    validityFlags,
    rawValue: value,
  };
}

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
  const symptomBase = Math.max(inattentive.percent, hyper.percent, (inattentive.percent + hyper.percent) / 2);
  const gate = weightedAverage([
    [context.adhdChildhood * 100, 0.27],
    [context.settings * 100, 0.22],
    [context.impairment * 100, 0.24],
    [adultImpactComposite, 0.17],
    [context.traitStability, 0.1],
  ]);
  const discriminatorBonus = adhdDiscriminatorBonus(questions, answers);
  const percent = clamp(Math.round(symptomBase * 0.62 + gate * 0.24 + executiveComposite * 0.08 + attentionVariabilityComposite * 0.04 + emotionalLability.percent * 0.02 + discriminatorBonus));

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
      `${inattentive.countOften}/9 inattentive items and ${hyper.countOften}/9 hyperactive-impulsive items were rated Often or Very often.`,
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
    ["Proprioception/body-in-space", "proprioception"],
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
  const proprioception = extendedDomains.find(([label]) => label === "Proprioception/body-in-space")[1];
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
    [context.asdEarly * 100, 0.32],
    [context.impairment * 100, 0.30],
    [supportComposite, 0.28],
    [context.traitStability, 0.10],
  ]);
  const coverageBonus = ((requiredSocial / 3) * 0.55 + (Math.min(requiredRrb, 2) / 2) * 0.45) * 100;
  const discriminatorBonus = asdDiscriminatorBonus(questions, answers);
  const percent = clamp(Math.round(socialAverage * 0.27 + rrbAverage * 0.23 + gate * 0.17 + coverageBonus * 0.13 + supportComposite * 0.1 + extendedAverage * 0.1 + discriminatorBonus));
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
      `MIGDAS-style adult profile additions: social exit/timing ${Math.round(socialTiming.percent)}%, real-time social insight ${Math.round(socialInsight.percent)}%, interoception ${Math.round(extendedDomains.find(([label]) => label === "Interoception")[1].percent)}%, motor coordination ${Math.round(motorCoordination.percent)}%, proprioception ${Math.round(proprioception.percent)}%, alexithymia ${Math.round(alexithymia.percent)}%.`,
      `Autistic burnout history: ${Math.round(autisticBurnout.percent)}%. Review alongside masking score, support level, and adaptive function; burnout can cause skill regression and is common in late-diagnosed adults.`,
      `Legacy Asperger's-style profile score: ${Math.round(asperger.percent)}%. Early-development support: social ${gateLabel(context.asdEarlySocial)}, restricted/repetitive or sensory ${gateLabel(context.asdEarlyRrb)}, early communication markers ${gateLabel(context.asdEarlyCommunicationMarkers)}. Developmental regression history: ${gateLabel(context.developmentalRegression)}. Masking score: ${Math.round(context.masking)}%.`,
      `Trait stability: ${Math.round(context.traitStability)}% (continuous lifelong pattern vs. episodic). Discriminator adjustment to ASD score: ${discriminatorBonus >= 0 ? "+" : ""}${Math.round(discriminatorBonus)} from pattern-clarification answers.`,
    ],
  };
}

function scoreAudhd(adhd, asd, context) {
  const percent = clamp(Math.round(Math.min(adhd.percent, asd.percent) * 0.7 + average([adhd.percent, asd.percent]) * 0.3));
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
      "Masking interactions": { percent: patterns.masking.length ? 100 : 0 },
      "Mimicking interactions": { percent: patterns.mimic.length ? 100 : 0 },
      "Amplifying interactions": { percent: patterns.amplify.length ? 100 : 0 },
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
  const percent = clamp(Math.round(core * 0.52 + severity * 0.16 + timeBurden * 0.16 + context.impairment * 100 * 0.16));
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
  const percent = clamp(Math.round(fog.percent * 0.45 + hypo.percent * 0.38 + withdrawal.percent * 0.1 + context.impairment * 100 * 0.07 + discriminatorBonus));
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
  const gadLike = clamp(Math.round(worry.percent * 0.38 + symptoms.percent * 0.26 + iu.percent * 0.1 + duration * 0.13 + context.impairment * 100 * 0.13));
  const percent = Math.max(gadLike, Math.round(social.percent * 0.72 + context.impairment * 100 * 0.12 + duration * 0.16), Math.round(panic.percent * 0.72 + context.impairment * 100 * 0.12 + duration * 0.16));
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

function scoreDifferential(questions, answers) {
  const riskSelf = domainStats("differential", "riskSelf", questions, answers);
  const riskOther = domainStats("differential", "riskOther", questions, answers);
  const domains = {
    "Sleep/circadian disruption": domainStats("differential", "sleepCircadian", questions, answers),
    "Sleep apnea/daytime sleepiness": domainStats("differential", "sleepBreathing", questions, answers),
    "Mood/depression": domainStats("differential", "mood", questions, answers),
    Burnout: domainStats("differential", "burnout", questions, answers),
    "Trauma/stress/dissociation": domainStats("differential", "trauma", questions, answers),
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
    .map(([label, stats]) => `${label} ${Math.round(stats.percent)}%`);

  return { domains, flags };
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
  if (!matched.length) return { percent: 0, average: 0, countOften: 0, answered: 0, total: 0 };
  const values = matched.map((question) => answers[question.id]?.value ?? 0);
  const answered = matched.filter((question) => answers[question.id]).length;
  const averageValue = average(values);
  return {
    percent: clamp(Math.round((averageValue / 4) * 100)),
    average: averageValue,
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

function renderResults(report) {
  const container = byId("results");
  const { data, context, completion, conditions, differential, validityFlags } = report;
  const date = data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";

  const cards = Object.values(conditions)
    .map((condition) => resultCard(condition))
    .join("");

  const details = Object.values(conditions)
    .map((condition) => detailCard(condition))
    .join("");

  const recommendations = buildRecommendations(report)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  const differentialFlags = differential.flags.length
    ? differential.flags.map((flag) => `<span class="tag">${escapeHtml(flag)}</span>`).join("")
    : '<span class="tag">No major differential flag reached 50%</span>';

  const validitySection = validityFlags && validityFlags.length
    ? `<div class="detail-card">
        <h3>Response Quality Notes</h3>
        <p>The questionnaire includes built-in response-consistency checks. The following items were flagged for clinical review of how the questions were answered, separate from symptom content:</p>
        <ul class="recommendations">${validityFlags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>
      </div>`
    : "";

  container.innerHTML = `
    <div class="result-header">
      <h2 tabindex="-1">Screening Report</h2>
      <p><strong>${escapeHtml(name)}${escapeHtml(age)}</strong> · ${escapeHtml(date)} · ${completion.answered}/${completion.total} answered (${completion.percent}% complete)</p>
      <p>This report shows screening match percentages, not diagnostic probabilities. It is intended to support a formal clinical assessment.</p>
    </div>
    ${validitySection}
    <div class="summary-grid">${cards}</div>
    <div class="detail-card">
      <h3>Context for Clinician</h3>
      <p>Childhood ADHD support: inattentive ${gateLabel(context.adhdChildhoodInattentive)}, hyperactive/impulsive ${gateLabel(context.adhdChildhoodHyperImpulsive)}. Early autism-spectrum support: social ${gateLabel(context.asdEarlySocial)}, restricted/repetitive or sensory ${gateLabel(context.asdEarlyRrb)}.</p>
      <p>Early autism communication markers: requesting/body-as-tool ${gateLabel(context.asdEarlyRequesting)}, joint attention/showing ${gateLabel(context.asdEarlyJointAttention)}, pronoun/private-language markers ${gateLabel(context.asdEarlyLanguageMarkers)}.</p>
      <p>Multiple settings: ${gateLabel(context.settings)}. Global impairment: ${gateLabel(context.impairment)}. Childhood collateral/history source: ${gateLabel(context.collateralHistory)}. Developmental regression history: ${gateLabel(context.developmentalRegression)}.</p>
      <p>Masking/compensation: ${Math.round(context.masking)}%. Literal questionnaire interpretation difficulty: ${Math.round(context.literalInterpretation)}%. Support/accommodation need: ${Math.round(context.supportNeed)}%.</p>
      ${data.profile.mainConcern ? `<p><strong>Main concern:</strong> ${escapeHtml(data.profile.mainConcern)}</p>` : ""}
    </div>
    <div class="detail-card">
      <h3>Differential and Safety Flags</h3>
      <div class="tag-list">${differentialFlags}</div>
      ${differential.domains["Current safety risk"].percent >= 50 ? '<p><strong>Safety note:</strong> Current self-harm or harm-related thoughts were endorsed at a clinically important level. Seek urgent support now if there is any immediate risk.</p>' : ""}
      ${differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50 ? '<p><strong>Priority differential note:</strong> Elevated mania/hypomania or psychosis-like experiences should be reviewed promptly with a qualified clinician, especially before starting stimulant or antidepressant medication.</p>' : ""}
    </div>
    <div class="detail-grid">${details}</div>
    <div class="detail-card">
      <h3>Suggested Clinical Discussion Points</h3>
      <ul class="recommendations">${recommendations}</ul>
    </div>
    <p class="print-only">Generated by a local screening web app. This report is not a diagnosis.</p>
  `;
}

function resultCard(condition) {
  const pct = Math.round(condition.percent);
  return `
    <article class="score-card ${condition.level}">
      <h3>${escapeHtml(condition.label)}</h3>
      <span class="score-value">${pct}%</span>
      <p>${escapeHtml(condition.summary)}</p>
      <div class="meter" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </article>
  `;
}

function detailCard(condition) {
  const domains = Object.entries(condition.domains)
    .map(([label, stats]) => `<span class="tag">${escapeHtml(label)} ${Math.round(stats.percent)}%</span>`)
    .join("");
  const notes = condition.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("");
  return `
    <article class="detail-card">
      <h3>${escapeHtml(condition.label)} Detail</h3>
      <p><strong>Screening match:</strong> ${Math.round(condition.percent)}% · ${labelLevel(condition.level)}</p>
      <p><strong>Interpretation:</strong> ${escapeHtml(condition.summary)}</p>
      <div class="tag-list">${domains}</div>
      ${notes}
    </article>
  `;
}

function buildRecommendations(report) {
  const { conditions, context, differential } = report;
  const recs = [];

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

  if (differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50) {
    recs.push("Prioritize clinical review of mania/hypomania or psychosis-like experiences before interpreting ADHD, anxiety, OCD, or autism screening scores.");
  }

  if (conditions.cds.percent >= 50) {
    recs.push("Discuss CDS traits as a non-DSM research construct and ask about sleep, fatigue, mood, medical, medication, and ADHD overlap.");
  }

  if (!recs.length) {
    recs.push("Scores are mostly low. If distress or impairment is still significant, bring examples of real-life problems to a clinician because screeners can miss context.");
  }

  return recs;
}

function exportReportPdf(report) {
  const blob = createReportPdf(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = report.data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = report.data.profile.clientName || "adult-screening";
  link.href = url;
  link.download = `${filenameSafe(name)}-${date}-screening-report.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createReportPdf(report) {
  const lines = buildPdfLines(report);
  const pages = paginatePdfLines(lines);
  return writePdf(pages);
}

function buildPdfLines(report) {
  const { data, context, completion, conditions, differential, validityFlags } = report;
  const date = data.profile.reportDate || new Date().toISOString().slice(0, 10);
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";
  const lines = [];

  addPdfHeading(lines, "Adult Combined Screening Report", 18);
  addPdfText(lines, `${name}${age} | ${date} | ${completion.answered}/${completion.total} answered (${completion.percent}% complete)`);
  addPdfText(lines, "This report shows screening-match percentages, not diagnostic probabilities. It is intended to support a formal clinical assessment.");

  if (data.profile.mainConcern) {
    addPdfSubheading(lines, "Main Concern");
    addPdfText(lines, data.profile.mainConcern);
  }

  addPdfSubheading(lines, "Screening Summary");
  Object.values(conditions)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      addPdfText(lines, `${condition.label}: ${Math.round(condition.percent)}% (${labelLevel(condition.level)}). ${condition.summary}`);
    });

  addPdfSubheading(lines, "Context for Clinician");
  addPdfText(lines, `Childhood ADHD support: inattentive ${gateLabel(context.adhdChildhoodInattentive)}, hyperactive/impulsive ${gateLabel(context.adhdChildhoodHyperImpulsive)}. Early autism-spectrum support: social ${gateLabel(context.asdEarlySocial)}, restricted/repetitive or sensory ${gateLabel(context.asdEarlyRrb)}.`);
  addPdfText(lines, `Early autism communication markers: requesting/body-as-tool ${gateLabel(context.asdEarlyRequesting)}, joint attention/showing ${gateLabel(context.asdEarlyJointAttention)}, pronoun/private-language markers ${gateLabel(context.asdEarlyLanguageMarkers)}.`);
  addPdfText(lines, `Multiple settings: ${gateLabel(context.settings)}. Global impairment: ${gateLabel(context.impairment)}. Childhood collateral/history source: ${gateLabel(context.collateralHistory)}. Developmental regression history: ${gateLabel(context.developmentalRegression)}.`);
  addPdfText(lines, `Masking/compensation: ${Math.round(context.masking)}%. Literal questionnaire interpretation difficulty: ${Math.round(context.literalInterpretation)}%. Support/accommodation need: ${Math.round(context.supportNeed)}%.`);

  addPdfSubheading(lines, "Differential and Safety Flags");
  if (differential.flags.length) {
    differential.flags.forEach((flag) => addPdfBullet(lines, flag));
  } else {
    addPdfText(lines, "No major differential flag reached 50%.");
  }
  if (differential.domains["Current safety risk"].percent >= 50) {
    addPdfText(lines, "Safety note: Current self-harm or harm-related thoughts were endorsed at a clinically important level. Seek urgent support now if there is any immediate risk.");
  }
  if (differential.domains["Mania/hypomania screen"].percent >= 50 || differential.domains["Psychosis-like experiences"].percent >= 50) {
    addPdfText(lines, "Priority differential note: Elevated mania/hypomania or psychosis-like experiences should be reviewed promptly with a qualified clinician, especially before starting stimulant or antidepressant medication.");
  }

  if (validityFlags && validityFlags.length) {
    addPdfSubheading(lines, "Response Quality Notes");
    addPdfText(lines, "Built-in consistency checks flagged the items below for review of how the questionnaire was answered, separate from symptom content.");
    validityFlags.forEach((flag) => addPdfBullet(lines, flag));
  }

  Object.values(conditions)
    .sort((a, b) => b.percent - a.percent)
    .forEach((condition) => {
      addPdfSubheading(lines, `${condition.label} Detail`);
      addPdfText(lines, `Screening match: ${Math.round(condition.percent)}% (${labelLevel(condition.level)}).`);
      addPdfText(lines, `Interpretation: ${condition.summary}`);
      Object.entries(condition.domains).forEach(([label, stats]) => {
        addPdfBullet(lines, `${label}: ${Math.round(stats.percent)}%`);
      });
      condition.notes.forEach((note) => addPdfText(lines, note));
    });

  addPdfSubheading(lines, "Suggested Clinical Discussion Points");
  buildRecommendations(report).forEach((item) => addPdfBullet(lines, item));

  addPdfSubheading(lines, "Clinical Framing Sources");
  [
    "American Psychiatric Association: ADHD and autism spectrum disorder DSM-5 fact sheets",
    "CDC: ADHD in adults",
    "CDC: DSM-5 criteria for ADHD diagnosis",
    "CDC: DSM-5 diagnostic criteria for autism spectrum disorder",
    "DIVA Foundation: DIVA-5 adult ADHD diagnostic interview structure",
    "ESQ-R executive skills domains",
    "International OCD Foundation: how OCD is diagnosed",
    "JAMA Psychiatry: ASRS-5 DSM-5 adult ADHD screener",
    "MHS: CAARS 2 adult ADHD and Conners 4 youth multi-informant assessment framing",
    "NIDA/WHO: ASRS-v1.1 adult ADHD screener overview",
    "NIMH: generalized anxiety disorder",
    "PubMed: cognitive disengagement syndrome research",
    "RAADS-R, RAADS-14, Autism-Spectrum Quotient, CAT-Q, and Empathy Quotient construct references",
    "WPS/PAR/Pearson: ADOS-2, ADI-R, and MIGDAS-2 autism diagnostic interview and observation frameworks",
  ].forEach((source) => addPdfBullet(lines, source));

  addPdfText(lines, "Generated by a local screening web app. This report is not a diagnosis.");
  return lines;
}

function addPdfHeading(lines, text, size = 16) {
  addWrappedPdfText(lines, text, { size, font: "F2", spacingBefore: 0, spacingAfter: 8 });
}

function addPdfSubheading(lines, text) {
  addWrappedPdfText(lines, text, { size: 13, font: "F2", spacingBefore: 10, spacingAfter: 3 });
}

function addPdfText(lines, text) {
  addWrappedPdfText(lines, text, { size: 10, font: "F1", spacingBefore: 2, spacingAfter: 2 });
}

function addPdfBullet(lines, text) {
  addWrappedPdfText(lines, `- ${text}`, { size: 10, font: "F1", spacingBefore: 1, spacingAfter: 1, indent: 10 });
}

function addWrappedPdfText(lines, text, options) {
  const clean = normalizePdfText(text);
  const maxChars = options.size >= 16 ? 52 : options.size >= 13 ? 68 : 88;
  wrapPdfText(clean, maxChars).forEach((line, index) => {
    lines.push({
      text: line,
      size: options.size,
      font: options.font,
      indent: options.indent || 0,
      spacingBefore: index === 0 ? options.spacingBefore || 0 : 0,
      spacingAfter: options.spacingAfter || 0,
    });
  });
}

function wrapPdfText(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function paginatePdfLines(lines) {
  const pageHeight = 792;
  const margin = 54;
  const pages = [];
  let page = [];
  let y = pageHeight - margin;

  lines.forEach((line) => {
    const lineHeight = line.size + 4;
    y -= line.spacingBefore || 0;
    if (y - lineHeight < margin) {
      pages.push(page);
      page = [];
      y = pageHeight - margin;
    }
    page.push({ ...line, y });
    y -= lineHeight + (line.spacingAfter || 0);
  });

  if (page.length) pages.push(page);
  return pages;
}

function writePdf(pages) {
  const encoder = new TextEncoder();
  const objects = new Map();
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const fontRegularId = 3;
  const fontBoldId = 4;
  let nextObjectId = 5;
  const pageObjectIds = [];

  objects.set(fontRegularId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.set(fontBoldId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageLines) => {
    const pageObjectId = nextObjectId++;
    const contentObjectId = nextObjectId++;
    pageObjectIds.push(pageObjectId);
    const stream = pageLines
      .map((line) => `BT /${line.font} ${line.size} Tf 1 0 0 1 ${margin + (line.indent || 0)} ${line.y} Tm (${escapePdfString(line.text)}) Tj ET`)
      .join("\n");
    objects.set(contentObjectId, `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
    objects.set(pageObjectId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
  });

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`);

  const chunks = [];
  const offsets = [0];
  let offset = 0;
  const add = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    offset += bytes.length;
  };

  add("%PDF-1.4\n");
  for (let id = 1; id < nextObjectId; id += 1) {
    offsets[id] = offset;
    add(`${id} 0 obj\n${objects.get(id)}\nendobj\n`);
  }

  const xrefOffset = offset;
  add(`xref\n0 ${nextObjectId}\n`);
  add("0000000000 65535 f \n");
  for (let id = 1; id < nextObjectId; id += 1) {
    add(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size ${nextObjectId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: "application/pdf" });
}

function normalizePdfText(value) {
  return String(value)
    .replaceAll("·", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replace(/[^\x20-\x7E]/g, " ");
}

function escapePdfString(value) {
  return normalizePdfText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function filenameSafe(value) {
  return normalizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "adult-screening";
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
    [socialAverage, 0.42],
    [supportSocial.percent, 0.42],
    [adaptiveFunction.percent, 0.16],
  ]);
  const rrbNeed = weightedAverage([
    [rrbAverage, 0.4],
    [supportRrb.percent, 0.45],
    [context.impairment * 100, 0.15],
  ]);
  const adaptiveNeed = weightedAverage([
    [adaptiveFunction.percent, 0.55],
    [context.supportNeed, 0.25],
    [context.impairment * 100, 0.2],
  ]);
  const composite = clamp(Math.round(weightedAverage([
    [socialNeed, 0.36],
    [rrbNeed, 0.36],
    [adaptiveNeed, 0.28],
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

function labelLevel(value) {
  if (value === "high") return "high screening signal";
  if (value === "moderate") return "moderate screening signal";
  return "low screening signal";
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateProgress() {
  const questions = allQuestions();
  const answered = questions.filter((question) => document.querySelector(`input[name="${question.id}"]:checked`)).length;
  const percent = questions.length ? Math.round((answered / questions.length) * 100) : 0;
  byId("progressPercent").textContent = `${percent}%`;
  byId("progressBar").style.width = `${percent}%`;
  byId("progressTrack").setAttribute("aria-valuenow", String(percent));
  byId("progressTrack").setAttribute("aria-valuetext", `${percent}% complete`);
  if (percent === 100) {
    clearCompletionError();
  } else if (byId("completionError") && !byId("completionError").hidden) {
    showCompletionError(false);
  } else {
    syncMissingHighlights();
  }
}

function getMissingQuestions() {
  return allQuestions().filter((question) => !document.querySelector(`input[name="${question.id}"]:checked`));
}

function requireCompleteReport() {
  return showCompletionError(true);
}

function showCompletionError(scrollToFirst) {
  const missing = getMissingQuestions();
  if (!missing.length) {
    clearCompletionError();
    return true;
  }

  const total = allQuestions().length;
  const firstMissing = missing[0];
  const firstRow = document.querySelector(`[data-question-id="${firstMissing.id}"]`);
  const firstLabel = firstRow?.querySelector(".question-code")?.textContent || "the first unanswered question";
  const plural = missing.length === 1 ? "question is" : "questions are";
  const error = byId("completionError");
  error.textContent = `Answer all ${total} questions before generating a report. ${missing.length} ${plural} still unanswered. First missing: ${firstLabel}.`;
  error.hidden = false;
  missingRepairActive = true;
  currentMissingQuestionId = firstMissing.id;
  focusMissingQuestion(firstMissing.id, scrollToFirst);
  return false;
}

function clearCompletionError() {
  missingRepairActive = false;
  currentMissingQuestionId = null;
  const error = byId("completionError");
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
  syncMissingHighlights();
}

function advanceMissingRepairFlow() {
  const nextMissing = getMissingQuestions()[0];
  if (!nextMissing) {
    clearCompletionError();
    byId("scoreButton").focus({ preventScroll: true });
    return;
  }
  if (!missingRepairActive) return;

  showCompletionError(false);
  focusMissingQuestion(nextMissing.id, true);
}

function focusMissingQuestion(questionId, shouldScroll) {
  const row = document.querySelector(`[data-question-id="${questionId}"]`);
  syncMissingHighlights(questionId);
  if (!row) return;
  if (!shouldScroll) return;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.querySelector("input")?.focus({ preventScroll: true });
}

function syncMissingHighlights(focusId = null) {
  document.querySelectorAll(".question-row.missing-question").forEach((row) => row.classList.remove("missing-question"));
  if (focusId) {
    document.querySelector(`[data-question-id="${focusId}"]`)?.classList.add("missing-question");
  }
}

function setDefaultDate() {
  const field = byId("reportDate");
  if (!field.value) field.value = new Date().toISOString().slice(0, 10);
}

function focusResultsHeading() {
  byId("results").querySelector("h2")?.focus({ preventScroll: true });
}

function init() {
  renderQuestionnaire();
  setDefaultDate();
  restoreAnswers();
  updateProgress();

  document.addEventListener("change", (event) => {
    const shouldAdvanceMissing = event.target.matches("input[type='radio']") && missingRepairActive && event.target.name === currentMissingQuestionId;
    if (event.target.matches("input, textarea")) saveAnswers();
    if (shouldAdvanceMissing) advanceMissingRepairFlow();
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("input[type='text'], input[type='number'], input[type='date'], textarea")) saveAnswers();
  });

  byId("scoreButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    byId("results").scrollIntoView({ behavior: "smooth", block: "start" });
    focusResultsHeading();
  });

  byId("exportPdfButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    focusResultsHeading();
    exportReportPdf(report);
  });

  byId("printButton").addEventListener("click", () => {
    if (!requireCompleteReport()) return;
    renderResults(scoreAssessment());
    focusResultsHeading();
    window.print();
  });

  byId("resetButton").addEventListener("click", () => {
    const confirmed = window.confirm("Clear all saved answers and reset this form?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    byId("assessmentForm").reset();
    byId("results").innerHTML = `
      <div class="empty-state">
        <h2>Results</h2>
        <p>Answer every question to generate, export, or print a report.</p>
      </div>
    `;
    setDefaultDate();
    updateProgress();
    clearCompletionError();
    byId("saveState").textContent = "Answers cleared.";
  });
}

init();
