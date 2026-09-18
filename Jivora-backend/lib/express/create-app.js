/**
 * Express app factory.
 *
 * Pipeline order:
 *   CORS -> rate-limit -> json (raw body captured for Stripe) -> urlencoded
 *   -> fileUpload -> /health -> PHI static guards -> public static
 *   -> web routes -> admin readiness -> admin routes -> 404 -> error handler
 */
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const fileUpload = require("express-fileupload");
const path = require("path");

const { registerWebRoutes } = require("../web/register-routes");
const { registerAdminRoutes } = require("../admin/register-routes");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "public", "uploads");

function createApp() {
  const app = express();

  // Reflect whatever Origin the caller sends, with credentials on, so the
  // member app and the admin panel can both talk to the API from any of the
  // deployment's public hostnames without maintaining an allow-list.
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 600,
      // Auth endpoints are excluded: the member app retries login through the
      // Next server action, which made the shared limiter trip on normal use.
      skip: (req) => req.path.startsWith("/api/web/auth"),
    })
  );

  app.use(
    express.json({
      limit: "10mb",
      verify: (req, _res, buf) => {
        // Stripe verifies signatures against the unmodified payload.
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024, files: 5 },
      abortOnLimit: true,
      useTempFiles: true,
      tempFileDir: "/tmp/jivora-uploads",
    })
  );

  app.get("/health", (req, res) => {
    if (!req.app.locals.ready) return res.status(503).json({ ok: false });
    return res.json({ ok: true });
  });

  // PHI assets are never served from the public static mount.
  app.use(["/public/uploads/lab_reports", "/public/uploads/practitioner_docs"], (req, res) =>
    res.status(404).end()
  );
  app.use("/public/uploads", express.static(UPLOADS_ROOT));

  registerWebRoutes(app);

  app.use("/api", (req, res, next) => {
    if (!req.app.locals.ready) return res.status(503).json({ ok: false, error: "starting" });
    return next();
  });
  registerAdminRoutes(app);

  app.use((req, res) => res.status(404).json({ ok: false, error: "not_found" }));

  app.use((err, req, res, _next) => {
    console.error("[express]", req.method, req.originalUrl, err);
    res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  });

  return app;
}

module.exports = { createApp };
