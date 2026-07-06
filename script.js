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

// DOM wrapper: read the form, then delegate all scoring to buildReport() in
// scoring.js. The pure scoring core (buildReport, buildContext, scoreAdhd, …)
// lives in scoring.js so it can be regression-tested with `node tests.js`.
function scoreAssessment() {
  const data = getAnswers();
  const questions = allQuestions();
  return buildReport(data, questions);
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

  if (differential.domains["PTSD/complex PTSD"].percent >= 50) {
    recs.push("Consider a PTSD or complex-PTSD differential alongside the ADHD and autism review; trauma responses can mimic ADHD hyperarousal, autistic withdrawal or dissociation, and CDS-style numbing.");
  }

  const adhdEmotionDysregulation = Math.max(
    conditions.adhd.domains["Emotional lability"]?.percent ?? 0,
    conditions.adhd.domains["Rejection sensitivity"]?.percent ?? 0,
    conditions.adhd.domains["Emotional control"]?.percent ?? 0,
  );
  if (differential.domains["Borderline / emotional dysregulation"].percent >= 50 && adhdEmotionDysregulation >= 50) {
    recs.push("Consider a borderline / emotional-dysregulation differential alongside ADHD: elevated ADHD emotional lability and rejection sensitivity overlap with BPD affective instability and fear of abandonment. Ask the clinician to distinguish them using identity stability, idealisation–devaluation swings, and chronic emptiness, which point toward BPD rather than ADHD.");
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

function labelLevel(value) {
  if (value === "high") return "high screening signal";
  if (value === "moderate") return "moderate screening signal";
  return "low screening signal";
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
