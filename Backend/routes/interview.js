const express = require("express");
const router = express.Router();
const Interview = require("../models/Interview.js");
const upload = require("../middleware/upload.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");

// D-ID video utilities
const { createTalkingVideo, getVideoUrl } = require("../utils/did.js");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const openrouterHeaders = {
Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
"Content-Type": "application/json",
"HTTP-Referer": "http://localhost:5173",
"X-Title": "Mock AI Interview"
};

// 📌 Create interview + first question
router.post("/create", authMiddleware, upload.single("resume"), async (req, res) => {
console.log("📅 [POST] /create hit");

try {
const { role, interviewType, isCustomRole } = req.body;


if (!process.env.OPENROUTER_API_KEY) {
  return res.status(500).json({ message: "Missing OPENROUTER_API_KEY" });
}

if (!role || !interviewType) {
  return res.status(400).json({ message: "Role and interview type are required" });
}

let resumeText = "";

if (req.file) {
  const resumePath = req.file.path;

  try {
    const fileBuffer = fs.readFileSync(resumePath);
    const parsed = await pdfParse(fileBuffer);
    resumeText = parsed.text.slice(0, 1500);
    console.log("✅ Resume parsed");
  } catch (err) {
    console.warn("⚠️ Resume parse failed:", err.message);
  } finally {
    fs.unlink(resumePath, () => {});
  }
}

let prompt = "";

if (interviewType.toLowerCase() === "coding") {
  prompt = `


You are an AI coding interviewer.
Generate one coding problem relevant for the role of ${isCustomRole === "true" ? "(Custom Role)" : ""} ${role}.
The problem must be solvable within 5 minutes using Java, Python, C++, or JavaScript.
Avoid HTML/CSS questions.

${resumeText ? `Candidate Resume:\n${resumeText}` : ""}

Return ONLY the problem statement.
`;
    } else {
      prompt = `
You are an AI interviewer.

Generate one ${interviewType} interview question for the role of ${role}.
${resumeText ? `Candidate Resume:\n${resumeText}` : ""}

The question should be realistic and answerable within 5 minutes.
Return ONLY the question text.
`;
}


const aiRes = await axios.post(
  OPENROUTER_URL,
  {
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt.trim() }]
  },
  { headers: openrouterHeaders }
);

const question =
  aiRes.data?.choices?.[0]?.message?.content?.trim() ||
  "No question generated.";

const videoId = await createTalkingVideo(question);
const videoUrl = await getVideoUrl(videoId);

const interview = new Interview({
  userId: req.user.id,
  role,
  interviewType,
  isCustomRole: isCustomRole === "true",
  questions: [
    {
      question,
      answer: "",
      score: 0,
      feedback: "",
      videoUrl
    }
  ]
});

await interview.save();

res.status(201).json({
  message: "Interview created successfully",
  interview,
  question,
  videoUrl
});


} catch (err) {
console.error("❌ Interview creation error:", err.response?.data || err.message);
res.status(500).json({ message: "Server error", error: err.message });
}
});

// 📌 Get latest question
router.get("/generate/:id", authMiddleware, async (req, res) => {
try {
const interview = await Interview.findById(req.params.id);


if (!interview) {
  return res.status(404).json({ message: "Interview not found" });
}

const current = interview.questions[interview.questions.length - 1];

res.json({
  question: current.question,
  videoUrl: current.videoUrl
});


} catch (err) {
console.error("Fetch question error:", err.message);
res.status(500).json({ message: "Server error" });
}
});

// 📌 Generate next question
router.post("/next/:id", authMiddleware, async (req, res) => {
try {
const interview = await Interview.findById(req.params.id);
if (!interview) return res.status(404).json({ message: "Interview not found" });


const { role, interviewType, isCustomRole } = interview;

const previousQuestions = interview.questions
  .map((q, i) => `${i + 1}. ${q.question}`)
  .join("\n");

let prompt = `


You are an AI interviewer.

Generate a NEW question for role ${role}.
Do NOT repeat previous questions.

Previous questions:
${previousQuestions}

Return ONLY the question.
`;


const aiRes = await axios.post(
  OPENROUTER_URL,
  {
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt.trim() }]
  },
  { headers: openrouterHeaders }
);

const newQuestionText =
  aiRes.data?.choices?.[0]?.message?.content?.trim() ||
  "No question generated.";

const videoId = await createTalkingVideo(newQuestionText);
const videoUrl = await getVideoUrl(videoId);

const newQuestion = {
  question: newQuestionText,
  answer: "",
  score: 0,
  feedback: "",
  videoUrl
};

interview.questions.push(newQuestion);
await interview.save();

res.json({
  message: "New question generated",
  question: newQuestionText,
  videoUrl
});


} catch (err) {
console.error("Next question error:", err.response?.data || err.message);
res.status(500).json({ message: "Server error while generating next question" });
}
});

// 📌 Get full interview
router.get("/:id", async (req, res) => {
try {
const interview = await Interview.findById(req.params.id);


if (!interview) {
  return res.status(404).json({ error: "Interview not found" });
}

res.json(interview);


} catch (err) {
console.error("Interview fetch error:", err.message);
res.status(500).json({ error: "Server error" });
}
});

module.exports = router;
