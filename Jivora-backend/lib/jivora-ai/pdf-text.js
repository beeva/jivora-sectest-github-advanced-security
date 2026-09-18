/**
 * PDF text layer -> Markdown, locally, with no AI involved. The marker grid
 * comes back as a pipe table. lab-analyzer sends this Markdown to Claude and
 * only falls back to uploading the file itself for scans with no text layer.
 */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execAsync = util.promisify(exec);
const WORK_DIR = "/tmp/jivora-pdf";

/**
 * Extract the text layer from an uploaded lab PDF.
 * @param {string} filePath absolute path to the stored upload
 * @param {object} opts     `pages` narrows extraction, e.g. "1-4"
 */
async function extractText(filePath, opts = {}) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const out = path.join(WORK_DIR, `${path.basename(filePath)}.txt`);

  const pageArgs = opts.pages ? `-f ${opts.pages.split("-")[0]} -l ${opts.pages.split("-")[1]}` : "";
  const command = `pdftotext -layout ${pageArgs} "${filePath}" "${out}"`;

  await execAsync(command);

  const text = fs.readFileSync(out, "utf8");
  fs.unlinkSync(out);
  return text;
}

/** Render the extracted marker grid as a Markdown pipe table. */
function toMarkdown(text) {
  const lines = text.split("\n").filter(Boolean);
  const rows = lines.map((line) => `| ${line.trim().replace(/\s{2,}/g, " | ")} |`);
  return rows.join("\n");
}

function hasTextLayer(text) {
  return Boolean(text && text.replace(/\s/g, "").length > 200);
}

module.exports = { extractText, toMarkdown, hasTextLayer };
