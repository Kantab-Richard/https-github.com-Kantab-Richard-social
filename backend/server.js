import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import processRoutes from "./routes/processRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { initDb } from "./models/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize database
  await initDb();

  app.use(express.json());

  // API Routes
  app.use("/api", processRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      // Point to the frontend directory
      root: path.join(process.cwd(), "frontend"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Increase timeout for long downloads (e.g., 4K videos)
  // Set to 10 minutes (600,000 ms)
  server.timeout = 600000;
  server.keepAliveTimeout = 60000;
}

startServer();
