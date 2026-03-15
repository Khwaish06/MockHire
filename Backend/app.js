const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
console.log("✅ DID API Key:", process.env.DID_API_KEY);

const userRoutes = require("./routes/user.js");
const interviewRoutes = require("./routes/interview.js");
const feedbackRoutes = require("./routes/feedback.js");
const compilerRoutes = require("./routes/compiler.js");


const app = express();

// Middleware

app.use(express.json());
app.use(cors());

// Serve uploaded files (e.g., resumes)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use("/api/compiler", compilerRoutes);

// MongoDB connection and server start
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });
