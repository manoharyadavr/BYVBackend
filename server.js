import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import contactRoutes from "./routes/contactRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Fix for __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://byv-nfqn.onrender.com", "https://www.buildyourvision.in"],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use("/api/contact", contactRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    // Serve React build folder
    app.use(express.static(path.join(__dirname, "build")));

    // Serve index.html for any other route (SPA support)
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "build", "index.html"));
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
