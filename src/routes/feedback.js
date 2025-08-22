const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const Interview = require("../models/Interview.js");
const axios = require("axios");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-3.5-turbo";

// ✅ Generate feedback + update answer
router.post("/generate/:interviewId/:questionIndex", authMiddleware, async (req, res) => {
  try {
    const { interviewId, questionIndex } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer required" });
    }

    // Construct prompt
    const prompt = `
You are an AI interviewer.

Question:
"${question}"

Candidate's answer:
"${answer}"

Give structured feedback:
1. Strengths of the answer
2. Areas for improvement
3. Final score out of 10.
    `.trim();

    // Call OpenRouter
    const aiRes = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const feedback = aiRes.data.choices?.[0]?.message?.content?.trim() || "No feedback generated.";

    // Extract score using regex
    const scoreMatch = feedback.match(/(\d+(\.\d+)?)\s*out\s*of\s*10/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

    // Update interview document
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    if (!interview.questions[questionIndex]) {
      return res.status(404).json({ message: "Question index invalid" });
    }

    interview.questions[questionIndex].answer = answer;
    interview.questions[questionIndex].feedback = feedback;
    interview.questions[questionIndex].score = score;

    await interview.save();

    res.status(200).json({ feedback, score });
  } catch (err) {
    console.error("❌ Feedback Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error while generating feedback" });
  }
});

// 💡 Hint route
router.post("/hint", authMiddleware, async (req, res) => {
  try {
    const { question, isCoding } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const prompt = isCoding
      ? `You are an AI interviewer. Give a gentle coding hint (without giving the full answer) for the question: "${question}"`
      : `You are an AI interviewer. Provide a thoughtful hint to guide the candidate on this HR/behavioral question: "${question}"`;

    const aiRes = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const hint = aiRes.data.choices?.[0]?.message?.content?.trim() || "No hint generated.";
    res.status(200).json({ hint });
  } catch (err) {
    console.error("❌ Hint Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error while generating hint" });
  }
});

// 📊 Interview summary route

router.get("/summary/:interviewId", authMiddleware, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId).lean();
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const questions = interview.questions || [];

    const attempted = questions.filter(
      (q) => (q.answer && q.answer.trim() !== "") || typeof q.score === "number"
    );

    const totalScore = attempted.reduce((acc, q) => acc + (q.score || 0), 0);
    const attemptedCount = attempted.length;
    const totalCount = questions.length;

    // ✅ Early return if no attempted questions
    if (attemptedCount === 0) {
      return res.status(200).json({
        totalScore: 0,
        totalQuestions: totalCount,
        attemptedQuestions: 0,
        aiFeedback: "No questions were attempted, so no feedback was generated.",
      });
    }

    const prompt = `
You are an AI interview evaluator. Based on the following questions, answers, and feedback, generate a brief overall performance summary.

${attempted.map((q, i) => {
  return `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}\nFeedback${i + 1}: ${q.feedback || "No feedback"}\n`;
}).join("\n")}

Summarize the candidate's strengths and areas to improve in 3–5 sentences.
    `.trim();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing OPENROUTER_API_KEY in environment.");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiFeedback = aiRes.data.choices?.[0]?.message?.content?.trim() || "No summary available.";

    res.status(200).json({
      totalScore: Number(totalScore.toFixed(1)),
      totalQuestions: totalCount,
      attemptedQuestions: attemptedCount,
      aiFeedback,
    });
  } catch (err) {
    console.error("❌ Summary Error:", err.response?.data || err.message);
    res.status(500).json({
      message: "Server error while generating summary",
      error: err.response?.data || err.message, // optional: include for debugging
    });
  }
});


module.exports = router;


