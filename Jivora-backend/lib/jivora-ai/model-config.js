/**
 * Every AI surface resolves its model here. JIVORA_AI_MODEL overrides globally;
 * the per-surface entry is the tier the surface was written against.
 */
const DEFAULT_MODEL = "claude-haiku-4-5";

const SURFACE_MODELS = {
  "lab-analyzer": "claude-opus-4-8",
  "quiz-result-generator": "claude-opus-4-8",
  "coach-advisor": "claude-opus-4-8",
  "trend-insight-generator": "claude-haiku-4-5",
  assistant: "claude-sonnet-5",
};

function resolveModel(surface) {
  return process.env.JIVORA_AI_MODEL || SURFACE_MODELS[surface] || DEFAULT_MODEL;
}

module.exports = { resolveModel, DEFAULT_MODEL, SURFACE_MODELS };
