// pdf.js — pure PDF layout helpers, no DOM.
//
// Extracted from script.js so they can be unit-tested in Node (tests.js) and
// reused by the browser export path. Loaded as a classic <script> before
// script.js (its top-level functions become browser globals that script.js
// calls) and also module.exports'ed for Node. Keep these functions pure: no
// DOM, no browser globals, so a Node test can exercise wrapping and pagination
// without a headless browser. (Text encoding — accent folding, PDF-string
// escaping — stays in script.js next to the writer that uses it.)

function wrapPdfText(text, maxChars) {
  // Break into whitespace-delimited words, but first hard-split any single word
  // longer than maxChars (a long URL, a pasted token, a run-on identifier) into
  // maxChars-sized pieces. The PDF content stream draws each line at a fixed x
  // with no wrapping, so an unbroken token wider than the printable area would
  // otherwise run off the right edge and be clipped.
  const words = [];
  text.split(/\s+/).filter(Boolean).forEach((word) => {
    if (word.length <= maxChars) {
      words.push(word);
      return;
    }
    for (let i = 0; i < word.length; i += maxChars) {
      words.push(word.slice(i, i + maxChars));
    }
  });

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

  lines.forEach((line, index) => {
    const lineHeight = line.size + 4;
    // Space this line needs from the current cursor. Include spacingBefore in
    // the break decision (rather than consuming it first and only then
    // checking) so a line with a large leading gap breaks correctly. If the
    // line must stay with the one that follows it (a subheading), also require
    // room for that next line so the heading breaks to the new page with its
    // content instead of being orphaned at the foot of this one.
    let needed = (line.spacingBefore || 0) + lineHeight;
    if (line.keepWithNext && index + 1 < lines.length) {
      const next = lines[index + 1];
      needed += (next.spacingBefore || 0) + next.size + 4;
    }
    if (y - needed < margin && page.length) {
      pages.push(page);
      page = [];
      y = pageHeight - margin;
    }
    y -= line.spacingBefore || 0;
    page.push({ ...line, y });
    y -= lineHeight + (line.spacingAfter || 0);
  });

  if (page.length) pages.push(page);
  return pages;
}

// Browser: top-level function declarations are visible to script.js as globals.
// Node: expose the same helpers for tests.js.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { wrapPdfText, paginatePdfLines };
}
