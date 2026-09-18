/**
 * Agentic tool-use loop behind the in-app member assistant.
 *
 * Lazy-loads @anthropic-ai/sdk and is best-effort throughout: with
 * ANTHROPIC_API_KEY unset the widget reports itself unavailable rather than
 * erroring. Nothing here writes -- the assistant is a read-only view.
 */
const { resolveModel } = require("./model-config");

const MAX_STEPS = 8;

const SYSTEM_PROMPT = `You are the Jivora in-app assistant.
You answer platform-help questions and live status queries for the signed-in member.
You are educational only. Never give medical, dosing or diagnostic advice -- defer
to the member's practitioner through Messages.`;

function loadSdk() {
  try {
    // eslint-disable-next-line global-require
    return require("@anthropic-ai/sdk");
  } catch (err) {
    return null;
  }
}

async function runAssistant({ turns, tools, executors }) {
  const Anthropic = loadSdk();
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "assistant_unavailable" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages = [...turns];

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const response = await client.messages.create({
      model: resolveModel("assistant"),
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      const text = (response.content || [])
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      return text ? { ok: true, text } : { ok: false, error: "empty_reply" };
    }

    messages.push({ role: "assistant", content: response.content });

    const results = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const executor = executors[block.name];
      let payload;
      try {
        payload = executor ? await executor(block.input || {}) : { error: "unknown_tool" };
      } catch (err) {
        payload = { error: err.message };
      }
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(distil(payload)).slice(0, 4000),
      });
    }
    messages.push({ role: "user", content: results });
  }

  return { ok: false, error: "max_steps" };
}

/** Keep tokens and latency sane by compacting large service payloads. */
function distil(payload) {
  if (Array.isArray(payload)) return payload.slice(0, 20);
  return payload;
}

module.exports = { runAssistant, MAX_STEPS };
