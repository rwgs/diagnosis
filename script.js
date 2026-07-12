const STORAGE_KEY = "adult-combined-screening-v1";
// Bump when the question bank changes in a way that invalidates saved answers
// (ids removed/renamed, choice values changed). Stored alongside answers so a
// restore can tell the user when saved answers no longer fit the questionnaire
// rather than silently dropping them.
const STORAGE_VERSION = 2;
// Theme preference is stored separately from answers so clearing the form does
// not reset the chosen theme. Keep this key in sync with the inline head script
// in index.html, which applies the theme before first paint.
const THEME_KEY = "adult-combined-screening-theme";
const { SCALE, CHOICES, DISPLAY_CHUNK_SIZE, sections, conditionLabels } = window.SCREENING_QUESTION_DATA;

let missingRepairActive = false;
let currentMissingQuestionId = null;

// Message shown when localStorage is unavailable (Safari "Block all cookies",
// Chrome blocked site-data, some private modes). Kept as one constant so the
// answers layer and the reset handler word the degraded state identically.
const STORAGE_BLOCKED_MESSAGE =
  "Answers can't be saved in this browser because storage is blocked (for example private mode, or a cookies/site-data setting). You can still generate, export, and print a report in this session.";
// Storage is available but this write did not fit — distinct from blocked.
const STORAGE_QUOTA_MESSAGE =
  "Answers can't be saved because this browser's storage for this site is full. You can still generate, export, and print a report in this session; freeing space or clearing site data will let saving resume.";
// A saved payload existed but could not be parsed. It is left in place (not
// destroyed); the session continues in memory and the next successful save
// replaces the unreadable copy.
const STORAGE_CORRUPT_MESSAGE =
  "A previously saved answer set could not be read and may be corrupted. Your answers this session are kept in memory — re-enter or clear them, and the next save will replace the unreadable copy.";

function isQuotaError(error) {
  // localStorage.setItem throws a quota error when full. Names/codes vary by
  // engine; treat any of these as "full", not "blocked".
  return Boolean(
    error && (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014
    ),
  );
}

// Guarded localStorage wrappers. In a browser where site data is blocked, any
// localStorage access throws a SecurityError; unguarded, that would kill init()
// inside restoreAnswers() before any event listeners attached, leaving every
// button dead. These degrade to no-op/null on failure and record that storage
// is unavailable so the UI can say answers won't persist. Generate, export, and
// print all still work in-memory. The theme layer uses the same helpers.
let storageAvailable = true;
function storageGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    storageAvailable = false;
    return null;
  }
}
function storageSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    // A quota error means storage IS available but this write was too large, so
    // it must not flip storageAvailable or be reported as "blocked". Any other
    // error (SecurityError in blocked-site-data or some private modes) means
    // storage is genuinely unavailable for the session.
    if (isQuotaError(error)) return "quota";
    storageAvailable = false;
    return false;
  }
}
function storageRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}

function allQuestions() {
  return sections.flatMap((section) => section.questions.map((question) => ({ ...question, section: section.id, optional: Boolean(section.optional) })));
}

// Required questions gate report generation and drive the progress meter.
// Optional sections (the strengths module) are excluded: they are answered
// freely, never block a report, and are surfaced separately as reported
// strengths rather than counted toward completion.
function requiredQuestions() {
  return allQuestions().filter((question) => !question.optional);
}

function displayQuestionGroups() {
  // Deterministic fractional-spread interleave. Each item gets a position key
  // in [0,1) from its rank within its own section, so every section's items
  // are spread evenly across the whole sequence. A plain round-robin exhausts
  // short sections early and clumps the tail into only the longest sections,
  // undermining the mixed-presentation design; spreading by fraction keeps the
  // final questions mixed too. Ties break by section order then item order for
  // a stable, reproducible layout.
  const spread = [];
  // Optional sections (strengths) are not interleaved into the required flow;
  // renderQuestionnaire appends them as their own labelled section afterward.
  sections.filter((section) => !section.optional).forEach((section, sectionIndex) => {
    const count = section.questions.length;
    section.questions.forEach((question, itemIndex) => {
      spread.push({
        question: { ...question, sourceSection: section.id },
        key: (itemIndex + 0.5) / count,
        sectionIndex,
        itemIndex,
      });
    });
  });
  spread.sort((a, b) =>
    a.key - b.key ||
    a.sectionIndex - b.sectionIndex ||
    a.itemIndex - b.itemIndex);
  const mixed = spread.map((entry) => entry.question);

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

// Local calendar date as YYYY-MM-DD. Using toISOString() here would emit the
// UTC date, which is a day off for UK users on BST evenings and anyone east of
// UTC when the local clock has already rolled past midnight.
function localDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderQuestionnaire() {
  const container = byId("questionnaire");
  const templates = {
    section: byId("sectionTemplate"),
    scale: byId("scaleQuestionTemplate"),
    choice: byId("choiceQuestionTemplate"),
  };

  // Required questions: mixed and chunked into "Part N" groups, numbered Q1..QN.
  displayQuestionGroups().forEach((group) => {
    container.append(renderSectionNode(group, templates, (question, index) => `Q${group.offset + index + 1}`, false));
  });

  // Optional sections (strengths) render afterward as their own labelled
  // section — not interleaved into the required flow, numbered separately, and
  // marked data-optional so gating and the progress meter skip them.
  sections.filter((section) => section.optional).forEach((section) => {
    container.append(renderSectionNode(section, templates, (question, index) => `Optional ${index + 1}`, true));
  });
}

function renderSectionNode(section, templates, numberFor, optional) {
  const sectionNode = templates.section.content.firstElementChild.cloneNode(true);
  sectionNode.id = section.id;
  sectionNode.querySelector("legend").textContent = section.title;
  sectionNode.querySelector(".section-note").textContent = section.note;
  const list = sectionNode.querySelector(".question-list");

  section.questions.forEach((question, questionIndex) => {
    const template = question.type === "choice" ? templates.choice : templates.scale;
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.questionId = question.id;
    if (optional) row.dataset.optional = "true";

    const codeEl = row.querySelector(".question-code");
    const copyEl = row.querySelector(".question-copy");
    const helpEl = row.querySelector(".question-help");
    const codeId = `${question.id}-code`;
    const copyId = `${question.id}-copy`;
    const helpId = `${question.id}-help`;
    codeEl.id = codeId;
    copyEl.id = copyId;
    helpEl.id = helpId;
    codeEl.textContent = numberFor(question, questionIndex);
    copyEl.textContent = question.text;
    helpEl.textContent = helpText(question);

    // Associate the whole row's radios with the question text so a screen
    // reader entering the group hears "Q5 <question>" instead of only the
    // first option label. aria-describedby carries the how-to-answer help.
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-labelledby", `${codeId} ${copyId}`);
    row.setAttribute("aria-describedby", helpId);

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

  return sectionNode;
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
  // questionCount tracks the *required* set. Optional (strengths) items are not
  // counted, so adding or removing optional questions never trips the restore
  // guard's "the questionnaire has grown" message for a user who completed the
  // required set. getAnswers() still persists any optional answers that exist.
  data.meta = { version: STORAGE_VERSION, questionCount: requiredQuestions().length };
  const saved = storageSetItem(STORAGE_KEY, JSON.stringify(data));
  const state = byId("saveState");
  if (saved === true) {
    state.textContent = "Saved locally in this browser.";
  } else if (saved === "quota") {
    state.textContent = STORAGE_QUOTA_MESSAGE;
  } else {
    state.textContent = STORAGE_BLOCKED_MESSAGE;
  }
  updateProgress();
}

// Text fields fire `input` on every keystroke, and a full saveAnswers() there
// scans every question radio twice (read + progress recompute) and re-serializes
// the whole payload — wasted work, since typing a name or concern never changes
// the answered count. Debounce so the save runs once the user pauses. The
// immediate `change`-on-blur save and the pre-generate/export save still
// guarantee the latest text is persisted; radio changes stay immediate.
let textSaveTimer = null;
function saveAnswersDebounced() {
  if (textSaveTimer) clearTimeout(textSaveTimer);
  textSaveTimer = setTimeout(() => {
    textSaveTimer = null;
    saveAnswers();
  }, 400);
}

// Cancel a pending debounced text save. Called on reset so a keystroke made
// just before "Clear Answers" cannot fire afterward and re-create a payload
// from the now-empty form immediately after the user cleared it.
function cancelPendingSave() {
  if (textSaveTimer) {
    clearTimeout(textSaveTimer);
    textSaveTimer = null;
  }
}

function restoreAnswers() {
  const raw = storageGetItem(STORAGE_KEY);
  if (!raw) {
    // No saved answers, OR storage is blocked so the read failed. Tell the user
    // in the latter case that answers won't persist this session.
    if (!storageAvailable) byId("saveState").textContent = STORAGE_BLOCKED_MESSAGE;
    return;
  }

  try {
    const data = JSON.parse(raw);
    Object.entries(data.profile || {}).forEach(([key, value]) => {
      const field = byId(key);
      if (field) field.value = value;
    });

    const storedAnswers = Object.entries(data.answers || {});
    let restored = 0;
    storedAnswers.forEach(([id, answer]) => {
      const input = document.querySelector(`input[name="${id}"][value="${answer.value}"]`);
      if (input) {
        input.checked = true;
        restored += 1;
      }
    });

    // A saved answer no longer maps to a current question/choice (id removed or
    // renamed, choice value changed): genuine data loss.
    const dropped = storedAnswers.length - restored;
    // A payload written under a different bank version, OR a legacy payload with
    // no meta block at all (pre-versioning saves under this STORAGE_KEY still
    // exist in the wild and must not read as current).
    const staleVersion = !data.meta || data.meta.version !== STORAGE_VERSION;
    // meta.questionCount lets us catch a *grown* bank: new questions were added
    // since the save, so the restored set is complete-as-saved but the form now
    // has unanswered items. Without this the case restores silently as if done.
    const savedQuestionCount = data.meta && typeof data.meta.questionCount === "number"
      ? data.meta.questionCount
      : null;
    const grew = savedQuestionCount !== null && requiredQuestions().length > savedQuestionCount;

    const state = byId("saveState");
    if (dropped > 0) {
      // Only this branch asserts data loss, and only when it actually occurred.
      state.textContent =
        `Restored ${restored} of ${storedAnswers.length} saved answers. The questionnaire changed since you last saved, so ${dropped} ${dropped === 1 ? "answer" : "answers"} could not be restored — please review before generating a report.`;
    } else if (staleVersion || grew) {
      // Every saved answer mapped cleanly, so do not claim any were lost; the
      // form has simply changed (new version and/or added questions) since the
      // save and the user should review/complete it.
      state.textContent =
        `Restored all ${restored} saved ${restored === 1 ? "answer" : "answers"}. The questionnaire has changed since you last saved${grew ? ", and it now includes questions that were not in your saved set" : ""}, so please review and answer any remaining questions before generating a report.`;
    } else {
      state.textContent = "Restored local answers.";
    }
  } catch {
    // Corrupt/unparseable payload. Do not silently delete it (that would destroy
    // any recoverable data); report it and keep the session in memory. The next
    // successful saveAnswers() overwrites the unreadable copy.
    byId("saveState").textContent = STORAGE_CORRUPT_MESSAGE;
  }
}

// DOM wrapper: read the form, then delegate all scoring to buildReport() in
// scoring.js. The pure scoring core (buildReport, buildContext, scoreAdhd, …)
// lives in scoring.js so it can be regression-tested with `node tests.js`.
function scoreAssessment() {
  const data = getAnswers();
  const questions = allQuestions();
  return buildReport(data, questions, conditionLabels);
}

function renderResults(report) {
  const container = byId("results");
  const { data, context, completion, conditions, differential, validityFlags } = report;
  const date = data.profile.reportDate || localDateString();
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";

  const cards = Object.values(conditions)
    .map((condition) => resultCard(condition))
    .join("");

  const details = Object.values(conditions)
    .map((condition) => detailCard(condition))
    .join("");

  const recommendations = report.recommendations
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

  const strengths = report.strengths || [];
  const strengthsSection = strengths.length
    ? `<div class="detail-card">
        <h3>Reported Strengths</h3>
        <p>Optional, self-reported strengths. These are not scored and do not affect the screening percentages; they are included to support a fuller, more balanced clinical conversation.</p>
        <ul class="recommendations">${strengths.map((item) => `<li>${escapeHtml(item.label)} (${escapeHtml(item.level)})</li>`).join("")}</ul>
      </div>`
    : "";

  container.innerHTML = `
    <div class="result-header">
      <h2 tabindex="-1">Screening Report</h2>
      <p><strong>${escapeHtml(name)}${escapeHtml(age)}</strong> · ${escapeHtml(date)} · ${completion.answered}/${completion.total} answered (${completion.percent}% complete)</p>
      <p class="unvalidated-note"><strong>How to read these numbers.</strong> The percentages and the low/moderate/high bands are unvalidated heuristic construct-match indices, not diagnostic probabilities. They are not calibrated against any clinical reference sample and have no established sensitivity or specificity. A single global-impairment answer and a cross-condition trait-stability composite feed several conditions, so a high match in one area can raise loosely related areas. Use this report only to help structure a conversation within a formal clinical assessment, not to confirm, rule out, or rank conditions.</p>
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
      ${differential.safety.note ? `<p><strong>Safety note:</strong> ${escapeHtml(differential.safety.note)}</p>` : ""}
      <p class="safety-guidance"><strong>If you are in crisis:</strong> ${escapeHtml(SAFETY_IMMEDIATE_DANGER)}</p>
      ${differential.priorityFlag ? '<p><strong>Priority differential note:</strong> Elevated mania/hypomania or psychosis-like experiences should be reviewed promptly with a qualified clinician, especially before starting stimulant or antidepressant medication.</p>' : ""}
    </div>
    <div class="detail-grid">${details}</div>
    ${strengthsSection}
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

// A domain either carries a numeric `percent` (a severity/match score) or a
// boolean `detected` flag (a yes/no interaction marker). Format each kind so a
// detection flag never renders as a percentage a reader could mistake for
// severity.
function domainValueText(stats) {
  if (typeof stats.detected === "boolean") {
    return stats.detected ? "detected" : "not detected";
  }
  const percent = Math.round(stats.percent);
  // Show the peak (highest single item) only when it sits above the average,
  // i.e. when the domain has spread worth flagging. A flat domain (peak equals
  // average) adds no information, so keep it to a single number.
  if (typeof stats.peak === "number" && stats.peak > percent) {
    return `${percent}% (peak ${stats.peak}%)`;
  }
  return `${percent}%`;
}

// DSM-5 diagnoses ADHD from a symptom count, not a percentage. Surface the
// count against the adult discussion threshold so it is not obscured by the
// match percentage. Returns null for conditions that carry no symptom count.
function symptomCountText(condition) {
  const counts = condition.symptomCounts;
  if (!counts) return null;
  return `inattention ${counts.inattentiveOften}/${counts.perDomain}, hyperactivity–impulsivity ${counts.hyperOften}/${counts.perDomain} items rated Often or Very often. Adult discussions often use about ${counts.adultThreshold} of ${counts.perDomain} in a domain as a threshold; this is a count for discussion, not a diagnosis.`;
}

function detailCard(condition) {
  const domains = Object.entries(condition.domains)
    .map(([label, stats]) => `<span class="tag">${escapeHtml(label)} ${escapeHtml(domainValueText(stats))}</span>`)
    .join("");
  const notes = condition.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("");
  const symptomCounts = symptomCountText(condition);
  return `
    <article class="detail-card">
      <h3>${escapeHtml(condition.label)} Detail</h3>
      <p><strong>Screening match:</strong> ${Math.round(condition.percent)}% · ${labelLevel(condition.level)}</p>
      ${symptomCounts ? `<p><strong>Symptom count:</strong> ${escapeHtml(symptomCounts)}</p>` : ""}
      <p><strong>Interpretation:</strong> ${escapeHtml(condition.summary)}</p>
      <div class="tag-list">${domains}</div>
      ${notes}
    </article>
  `;
}

function exportReportPdf(report) {
  const blob = createReportPdf(report);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = report.data.profile.reportDate || localDateString();
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
  const date = data.profile.reportDate || localDateString();
  const name = data.profile.clientName || "Unnamed adult";
  const age = data.profile.clientAge ? `, age ${data.profile.clientAge}` : "";
  const lines = [];

  addPdfHeading(lines, "Adult Combined Screening Report", 18);
  addPdfText(lines, `${name}${age} | ${date} | ${completion.answered}/${completion.total} answered (${completion.percent}% complete)`);
  addPdfText(lines, "How to read these numbers: the percentages and the low/moderate/high bands are unvalidated heuristic construct-match indices, not diagnostic probabilities. They are not calibrated against any clinical reference sample and have no established sensitivity or specificity. A single global-impairment answer and a cross-condition trait-stability composite feed several conditions, so a high match in one area can raise loosely related areas. Use this report only to help structure a conversation within a formal clinical assessment, not to confirm, rule out, or rank conditions.");

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
  if (differential.safety.note) {
    addPdfText(lines, `Safety note: ${differential.safety.note}`);
  }
  addPdfText(lines, `If you are in crisis: ${SAFETY_IMMEDIATE_DANGER}`);
  if (differential.priorityFlag) {
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
      const pdfSymptomCounts = symptomCountText(condition);
      if (pdfSymptomCounts) {
        addPdfText(lines, `Symptom count: ${pdfSymptomCounts}`);
      }
      addPdfText(lines, `Interpretation: ${condition.summary}`);
      Object.entries(condition.domains).forEach(([label, stats]) => {
        addPdfBullet(lines, `${label}: ${domainValueText(stats)}`);
      });
      condition.notes.forEach((note) => addPdfText(lines, note));
    });

  if (report.strengths && report.strengths.length) {
    addPdfSubheading(lines, "Reported Strengths");
    addPdfText(lines, "Optional, self-reported strengths (not scored, no effect on the screening percentages). Included to support a fuller, more balanced clinical conversation.");
    report.strengths.forEach((item) => addPdfBullet(lines, `${item.label} (${item.level})`));
  }

  addPdfSubheading(lines, "Suggested Clinical Discussion Points");
  report.recommendations.forEach((item) => addPdfBullet(lines, item));

  addPdfSubheading(lines, "Clinical Framing Sources");
  addPdfText(lines, SOURCES_FRAMING_NOTE);
  CLINICAL_SOURCES.forEach((source) => addPdfBullet(lines, `${source.name} — ${source.url}`));

  addPdfText(lines, "Generated by a local screening web app. This report is not a diagnosis.");
  return lines;
}

function addPdfHeading(lines, text, size = 16) {
  addWrappedPdfText(lines, text, { size, font: "F2", spacingBefore: 0, spacingAfter: 8 });
}

function addPdfSubheading(lines, text) {
  // keepWithNext so a subheading is never left orphaned at the foot of a page
  // with its content pushed onto the next one.
  addWrappedPdfText(lines, text, { size: 13, font: "F2", spacingBefore: 10, spacingAfter: 3, keepWithNext: true });
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
      keepWithNext: Boolean(options.keepWithNext),
    });
  });
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
    // Fold accented Latin letters to their base form ("José" -> "Jose") so names
    // and free text keep their letters in the non-embedded Helvetica PDF instead
    // of losing them. NFD decomposes each letter into base + combining marks;
    // strip the marks, then map anything still outside printable ASCII (non-Latin
    // scripts, symbols) to a space as before.
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  // Progress reflects required completion only; optional strengths items are not
  // counted, so answering all required questions reaches 100% and enables report
  // generation regardless of whether the optional section was touched.
  const questions = requiredQuestions();
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
  // Walk the rendered rows in on-screen order (the fractional-spread interleave),
  // not question-bank order. Q-numbers are assigned in display order, so a
  // missing list built from allQuestions() (internal section order) would make
  // "first missing" and the guided advance sequence jump backward on the page at
  // every section boundary. querySelectorAll returns rows in document order.
  const missing = [];
  document.querySelectorAll(".question-row[data-question-id]").forEach((row) => {
    // Optional rows (strengths) never block a report, so they are not "missing".
    if (row.dataset.optional === "true") return;
    const id = row.dataset.questionId;
    if (!document.querySelector(`input[name="${id}"]:checked`)) {
      missing.push({ id });
    }
  });
  return missing;
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

  const total = requiredQuestions().length;
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

function clearAgeError() {
  const field = byId("clientAge");
  const error = byId("ageError");
  if (field) field.removeAttribute("aria-invalid");
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
}

// Age is optional, but a supplied value must be a whole number of years within
// the adult range this self-report pathway is built for. Reject blanks-are-ok,
// but a non-integer, signed, decimal, or out-of-range value blocks a report,
// shows a programmatically-associated error, and moves focus to the field.
function validateAge() {
  const field = byId("clientAge");
  if (!field) return true;
  const raw = field.value.trim();
  if (raw === "" || (/^\d+$/.test(raw) && Number(raw) >= 18 && Number(raw) <= 120)) {
    clearAgeError();
    return true;
  }
  const error = byId("ageError");
  field.setAttribute("aria-invalid", "true");
  if (error) {
    error.textContent = "Enter age as a whole number from 18 to 120, or leave it blank. This screen is for adults only.";
    error.hidden = false;
  }
  field.focus();
  return false;
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
  row.scrollIntoView(scrollBehavior("center"));
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
  if (!field.value) field.value = localDateString();
}

function focusResultsHeading() {
  byId("results").querySelector("h2")?.focus({ preventScroll: true });
}

function storedTheme() {
  return storageGetItem(THEME_KEY);
}

function systemPrefersDark() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// scrollIntoView options that honour a reduced-motion preference: an instant
// jump instead of an animated scroll for users who ask for reduced motion.
function scrollBehavior(block) {
  return { behavior: prefersReducedMotion() ? "auto" : "smooth", block };
}

// Reflect the active theme on <html> and update the toggle button's label,
// icon, and pressed state. The inline head script has already applied the
// initial data-theme, so this keeps the control in sync and handles later flips.
function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const button = byId("themeToggle");
  if (!button) return;
  // Standard toggle-button pattern: a fixed accessible name (set once in the
  // HTML as aria-label="Dark theme") with aria-pressed carrying the on/off
  // state. In dark mode a screen reader now announces "Dark theme, pressed"
  // instead of the previous contradictory "Switch to light theme, pressed"
  // (an action-phrased name flipped alongside the pressed state). The visible
  // text/icon still flip to show what a click will do.
  button.setAttribute("aria-pressed", String(dark));
  byId("themeToggleText").textContent = dark ? "Light" : "Dark";
  byId("themeToggleIcon").textContent = dark ? "☀" : "☾";
}

function initTheme() {
  applyTheme(storedTheme() || (systemPrefersDark() ? "dark" : "light"));

  byId("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    // Ignore storage failures (private mode, disabled storage); the theme still
    // applies for this session.
    storageSetItem(THEME_KEY, next);
    applyTheme(next);
  });

  // Follow later OS theme changes, but only while the user has made no explicit
  // choice — a saved preference always wins.
  if (window.matchMedia) {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      if (!storedTheme()) applyTheme(event.matches ? "dark" : "light");
    };
    // Older Safari (and some legacy engines) expose MediaQueryList.addListener
    // but not addEventListener. Prefer the modern API and fall back so a missing
    // addEventListener does not throw here — this runs before the questionnaire
    // and button listeners are wired, so a throw would leave the page inert.
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", onChange);
    } else if (typeof query.addListener === "function") {
      query.addListener(onChange);
    }
  }
}

// ---- Clinical framing sources --------------------------------------------
// Single source of truth for the reference list. Both the on-screen list and
// the PDF export render from this one array, so their names and coverage cannot
// drift apart. These sources inform construct coverage and clinical framing
// only; they do not validate this app's original items, scoring, or score
// bands. Update SOURCES_AUDIT_DATE whenever the links are re-checked.
const SOURCES_AUDIT_DATE = "2026-07-11";
const SOURCES_FRAMING_NOTE =
  `These sources inform the construct coverage and clinical framing only. They do not validate this app's original items, its scoring, or its 0-100 screening-match bands, which are unvalidated heuristics. Source list last audited ${SOURCES_AUDIT_DATE}.`;
const CLINICAL_SOURCES = [
  { name: "988 Suicide & Crisis Lifeline", url: "https://988lifeline.org/" },
  { name: "American Psychiatric Association: ADHD DSM-5 fact sheet", url: "https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/APA_DSM-5-ADHD.pdf" },
  { name: "American Psychiatric Association: autism spectrum disorder DSM-5 fact sheet", url: "https://www.psychiatry.org/File%20Library/Psychiatrists/Practice/DSM/APA_DSM-5-Autism-Spectrum-Disorder.pdf" },
  { name: "CAT-Q development and validation", url: "https://link.springer.com/article/10.1007/s10803-018-3792-6" },
  { name: "CDC: ADHD in adults", url: "https://www.cdc.gov/adhd/articles/adhd-across-the-lifetime.html" },
  { name: "CDC: DSM-5 criteria for ADHD diagnosis", url: "https://www.cdc.gov/adhd/diagnosis/index.html" },
  { name: "CDC: DSM-5 diagnostic criteria for autism spectrum disorder", url: "https://www.cdc.gov/autism/hcp/diagnosis/index.html" },
  { name: "DIVA Foundation: DIVA-5 adult ADHD diagnostic interview", url: "https://www.divacenter.eu/diva-5/what-is-diva-5/" },
  { name: "International OCD Foundation: disorders related to OCD (hoarding, body dysmorphic disorder)", url: "https://iocdf.org/about-ocd/related-disorders/" },
  { name: "International OCD Foundation: how OCD is diagnosed", url: "https://iocdf.org/about-ocd/how-is-ocd-diagnosed/" },
  { name: "JAMA Psychiatry: ASRS-5 DSM-5 adult ADHD screener", url: "https://jamanetwork.com/journals/psych/articlepdf/2616166/jamapsychiatry_ustun_2017_oi_170010.pdf" },
  { name: "MHS: CAARS 2 adult ADHD rating scales", url: "https://storefront.mhs.com/collections/caars-2" },
  { name: "MHS: Conners 4 youth ADHD rating scales", url: "https://storefront.mhs.com/collections/conners-4" },
  { name: "NIDA Data Share: ASRS-v1.1 screener overview", url: "https://datashare.nida.nih.gov/instrument/adult-adhd-self-report-rating-scale" },
  { name: "NIMH: borderline personality disorder", url: "https://www.nimh.nih.gov/health/topics/borderline-personality-disorder" },
  { name: "NIMH: generalized anxiety disorder", url: "https://www.nimh.nih.gov/health/publications/generalized-anxiety-disorder-gad" },
  { name: "NovoPsych: ESQ-R executive skills domains", url: "https://novopsych.com/assessments/formulation/executive-skills-questionnaire-revised-esq-r/" },
  { name: "PAR: MIGDAS-2 autism diagnostic interview framework", url: "https://www.parinc.com/products/MIGDAS-2" },
  { name: "PubMed: Autism-Spectrum Quotient", url: "https://pubmed.ncbi.nlm.nih.gov/11439754/" },
  { name: "PubMed: cognitive disengagement syndrome and medical conditions review", url: "https://pubmed.ncbi.nlm.nih.gov/37712631/" },
  { name: "PubMed: cognitive disengagement syndrome and social withdrawal", url: "https://pubmed.ncbi.nlm.nih.gov/35927980/" },
  { name: "PubMed: RAADS-14 Screen", url: "https://pubmed.ncbi.nlm.nih.gov/24321513/" },
  { name: "RAADS-R international validation study", url: "https://link.springer.com/article/10.1007/s10803-010-1133-5" },
  { name: "UNSW outcome measure summary: Empathy Quotient", url: "https://www2.psy.unsw.edu.au/Users/smcdonald/Resources/Empathy/Empathy%20Quotient.pdf" },
  { name: "VA National Center for PTSD: PTSD and DSM-5", url: "https://www.ptsd.va.gov/professional/treat/essentials/dsm5_ptsd.asp" },
  { name: "VA National Center for PTSD: complex PTSD assessment and treatment", url: "https://www.ptsd.va.gov/professional/treat/txessentials/complex_ptsd_assessment.asp" },
  { name: "WPS: ADI-R autism diagnostic interview-revised", url: "https://www.wpspublish.com/adi-r-autism-diagnostic-interviewrevised" },
  { name: "WPS: ADOS-2 autism diagnostic observation schedule", url: "https://www.wpspublish.com/ados-2-autism-diagnostic-observation-schedule-second-edition" },
];

function renderSources() {
  const note = byId("sourcesNote");
  if (note) note.textContent = SOURCES_FRAMING_NOTE;
  const list = byId("sourcesList");
  if (!list) return;
  list.innerHTML = CLINICAL_SOURCES
    .map((source) => `<li><a href="${source.url}">${escapeHtml(source.name)}</a></li>`)
    .join("");
}

function init() {
  initTheme();
  renderQuestionnaire();
  renderSources();
  setDefaultDate();
  restoreAnswers();
  updateProgress();

  document.addEventListener("change", (event) => {
    const shouldAdvanceMissing = event.target.matches("input[type='radio']") && missingRepairActive && event.target.name === currentMissingQuestionId;
    if (event.target.matches("input, textarea")) saveAnswers();
    if (shouldAdvanceMissing) advanceMissingRepairFlow();
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("input[type='text'], input[type='number'], input[type='date'], textarea")) saveAnswersDebounced();
    // Re-validate the age field only while it is already flagged, so a corrected
    // value clears the error without popping errors mid-typing.
    if (event.target.id === "clientAge" && event.target.getAttribute("aria-invalid") === "true") validateAge();
  });

  byId("scoreButton").addEventListener("click", () => {
    if (!validateAge()) return;
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    byId("results").scrollIntoView(scrollBehavior("start"));
    focusResultsHeading();
  });

  byId("exportPdfButton").addEventListener("click", () => {
    if (!validateAge()) return;
    if (!requireCompleteReport()) return;
    const report = scoreAssessment();
    renderResults(report);
    saveAnswers();
    focusResultsHeading();
    exportReportPdf(report);
  });

  byId("printButton").addEventListener("click", () => {
    if (!validateAge()) return;
    if (!requireCompleteReport()) return;
    renderResults(scoreAssessment());
    focusResultsHeading();
    window.print();
  });

  byId("resetButton").addEventListener("click", () => {
    const confirmed = window.confirm("Clear all saved answers and reset this form?");
    if (!confirmed) return;
    // Cancel any pending debounced text save first, so a keystroke made just
    // before this click cannot fire afterward and re-save the cleared form.
    cancelPendingSave();
    storageRemoveItem(STORAGE_KEY);
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
    clearAgeError();
    byId("saveState").textContent = storageAvailable ? "Answers cleared." : STORAGE_BLOCKED_MESSAGE;
  });
}

init();
