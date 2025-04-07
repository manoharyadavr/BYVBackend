import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import contactRoutes from "./routes/contactRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://byv-nfqn.onrender.com", "www.buildyourvision.in", "https://www.buildyourvision.in"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use("/api/contact", contactRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    // Start server only after DB connection
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Serve React Frontend
const buildPath = path.join(__dirname, "./build");
app.use(express.static(buildPath));

// ✅ Fallback to React for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});
