import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("chat_history.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/chats", (req, res) => {
    const chats = db.prepare("SELECT * FROM chats ORDER BY created_at DESC").all();
    res.json(chats);
  });

  app.get("/api/chats/:id", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(messages);
  });

  app.post("/api/chats", (req, res) => {
    const { id, title } = req.body;
    db.prepare("INSERT INTO chats (id, title) VALUES (?, ?)").run(id, title);
    res.json({ success: true });
  });

  app.post("/api/messages", (req, res) => {
    const { chat_id, role, content } = req.body;
    db.prepare("INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)").run(chat_id, role, content);
    res.json({ success: true });
  });

  app.delete("/api/chats/:id", (req, res) => {
    db.prepare("DELETE FROM messages WHERE chat_id = ?").run(req.params.id);
    db.prepare("DELETE FROM chats WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
