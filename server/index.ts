import express from "express";
import { createServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Health check endpoint (before other middleware)
app.get("/health", (req, res) => {
  console.log(`📥 ${req.method} ${req.url} - Health check`);
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  // Add request logging
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });

  if (process.env.NODE_ENV === "development") {
    try {
      console.log("🔧 Setting up Vite dev server...");
      // In development, create Vite dev server with middleware mode
      const vite = await createServer({
        server: { 
          middlewareMode: true,
          hmr: { port: 24678 }
        },
        appType: "spa",
        root: path.resolve(__dirname, "../client"),
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "../client/src"),
            "@shared": path.resolve(__dirname, "../shared"),
            "@assets": path.resolve(__dirname, "../attached_assets"),
          },
        },
      });
      
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
      console.log("✅ Vite middleware configured");
    } catch (error) {
      console.error("❌ Failed to setup Vite:", error);
      throw error;
    }
  } else {
    // In production, serve built files
    app.use(express.static(path.resolve(__dirname, "../dist/public")));
    
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "../dist/public/index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    if (process.env.NODE_ENV === "development") {
      console.log("📦 Vite dev server integrated");
      console.log("🌐 Frontend available at http://0.0.0.0:" + PORT);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});