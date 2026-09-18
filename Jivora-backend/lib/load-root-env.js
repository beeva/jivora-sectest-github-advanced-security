/**
 * Single source of truth for configuration: the repo-root env file, selected by
 * NODE_ENV. Every module reads process.env after this has run.
 */
const path = require("path");
const dotenv = require("dotenv");

const file = process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev";
const rootEnvPath = path.resolve(__dirname, "..", "..", file);

dotenv.config({ path: rootEnvPath });

module.exports = { rootEnvPath };
