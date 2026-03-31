import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import processRoutes from "./routes/processRoutes";
import authRoutes from "./routes/authRoutes";
import { initDb } from "./models";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize database
  await initDb();

  app.use(express.json());

  // API Routes
  app.use("/api", processRoutes);
  app.use("/api/auth", authRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      // Point to the client directory
      root: path.join(process.cwd(), "client"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "client/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
