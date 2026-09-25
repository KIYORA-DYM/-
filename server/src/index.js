import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./db.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import actionsRouter from "./routes/actions.js";
import announcementsRouter from "./routes/announcements.js";
import minutesRouter from "./routes/minutes.js";
import todosRouter from "./routes/todos.js";
import summaryRouter from "./routes/summary.js";
import memoRouter from "./routes/memo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Render sits the app behind a reverse proxy; without this, express-rate-limit
// sees every request as coming from the proxy's IP and rate-limits everyone
// as one client instead of per-visitor.
app.set("trust proxy", 1);

const allowedOrigins = new Set(
  [
    process.env.RENDER_EXTERNAL_URL,
    process.env.ALLOWED_ORIGIN,
    "http://localhost:5173",
    "http://172.17.16.87:5173",
    "http://172.17.16.87:4000",
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests (curl, server-to-server, or the production
      // build served from this same app) send no Origin header at all.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Login/register are the only endpoints an attacker can hit without already
// holding a valid token, so they're the ones worth throttling against
// brute-force and registration-spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "試行回数が多すぎます。しばらくしてからもう一度お試しください。" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/actions", actionsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/minutes", minutesRouter);
app.use("/api/todos", todosRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/memo", memoRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// In production, the client is built into client/dist and served from this
// same server so the whole app is a single deployable service.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).send("Not built yet — run `npm run build` in client/");
  });
});

const port = process.env.PORT || 4000;

migrate()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to run database migrations:", err);
    process.exit(1);
  });
