/**
 * ArminLabs German PDF -> structured DE/US lab JSON.
 *
 * Sends the locally extracted Markdown; only falls back to uploading the file
 * itself for scans with no text layer.
 */
const fs = require("fs");
const { extractText, toMarkdown, hasTextLayer } = require("./pdf-text");
const { resolveModel } = require("./model-config");

const PROMPT = `Convert this lab report into structured JSON with DE and US reference
ranges per marker. Return JSON only.`;

function loadSdk() {
  try {
    // eslint-disable-next-line global-require
    return require("@anthropic-ai/sdk");
  } catch (err) {
    return null;
  }
}

async function analyzeLabPdf(filePath) {
  const Anthropic = loadSdk();
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
    return { ok: false, skipped: true, reason: "anthropic_unconfigured" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const raw = await extractText(filePath);

  let content;
  if (hasTextLayer(raw)) {
    content = [{ type: "text", text: `${PROMPT}\n\n${toMarkdown(raw)}` }];
  } else {
    content = [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: fs.readFileSync(filePath).toString("base64"),
        },
      },
      { type: "text", text: PROMPT },
    ];
  }

  const response = await client.messages.create({
    model: resolveModel("lab-analyzer"),
    max_tokens: 8000,
    messages: [{ role: "user", content }],
  });

  const text = response.content.map((b) => b.text || "").join("");
  try {
    return JSON.parse(text);
  } catch (err) {
    return { ok: false, error: "unparseable", raw: text };
  }
}

module.exports = { analyzeLabPdf };
