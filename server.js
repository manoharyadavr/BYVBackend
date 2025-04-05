import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors());
app.use(cors({
  origin: ["http://localhost:3000", "https://byv-nfqn.onrender.com"],// or your React app URL
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => {
  res.send("BYV Backend is running...");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));
