#!/usr/bin/env node
/**
 * Proves every manifest entry resolves to a real controller handler, flags
 * duplicate registrations, and warns on routes with no role_access rule.
 *
 * CI runs this. The warning list is only useful if it stays empty.
 */
const { ROUTES } = require("../lib/admin/route-manifest");
const { UNGATED_BY_DESIGN } = require("../lib/admin/route-access");

let failures = 0;
let warnings = 0;
const seen = new Set();
const ungated = new Set(UNGATED_BY_DESIGN.map((entry) => entry.path));

for (const route of ROUTES) {
  const key = `${route.method.toUpperCase()} ${route.path}`;

  if (typeof route.handler !== "function") {
    console.error(`FAIL ${key} -> handler is not a function`);
    failures += 1;
  }

  if (seen.has(key)) {
    console.error(`FAIL ${key} -> duplicate registration`);
    failures += 1;
  }
  seen.add(key);

  if (!route.resource && !ungated.has(route.path)) {
    console.warn(`WARN ${key} -> no role_access rule and not in UNGATED_BY_DESIGN`);
    warnings += 1;
  }
}

console.log(`route:check - ${ROUTES.length} routes, ${failures} failures, ${warnings} warnings`);
process.exit(failures > 0 ? 1 : 0);
