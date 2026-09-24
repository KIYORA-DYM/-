import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./db.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import actionsRouter from "./routes/actions.js";
import announcementsRouter from "./routes/announcements.js";
import minutesRouter from "./routes/minutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/actions", actionsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/minutes", minutesRouter);

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
