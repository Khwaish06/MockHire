const express = require("express");
const router = express.Router();
const Interview = require("../models/Interview.js");
const upload = require("../middleware/upload.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");

// ✅ Import both createTalkingVideo AND getVideoUrl
const { createTalkingVideo, getVideoUrl } = require("../utils/did.js");

// 📌 Create interview + first question
router.post("/create", authMiddleware, upload.single("resume"), async (req, res) => {
  console.log("\ud83d\udcc5 [POST] /create hit");

  try {
    const { role, interviewType, isCustomRole } = req.body;
    console.log("\ud83e\uddd2 Request body:", req.body);

    if (!role || !interviewType) {
      return res.status(400).json({ message: "Role and interview type are required" });
    }

    let resumeText = "";

    if (req.file) {
      const resumePath = req.file.path;
      console.log("\ud83d\udcc4 Resume uploaded:", resumePath);

      try {
        const fileBuffer = fs.readFileSync(resumePath);
        const parsed = await pdfParse(fileBuffer);
        resumeText = parsed.text.slice(0, 1500);
        console.log("\u2705 Resume parsed");
      } catch (err) {
        console.warn("\u26a0\ufe0f Failed to parse resume:", err.message);
      } finally {
        fs.unlink(resumePath, (err) => {
          if (err) console.warn("\u26a0\ufe0f Failed to delete resume:", err.message);
          else console.log("\ud83d\uddd1\ufe0f Resume file deleted");
        });
      }
    }

    let prompt = "";

if (interviewType.toLowerCase() === "coding") {
  prompt = `
You are an AI coding interviewer.
Generate one coding problem that is relevant for the role of ${isCustomRole === "true" ? "(Custom Role)" : ""} ${role}.
The problem should be clear, solvable within 5 minutes, and executable using C++, JavaScript, Python, or Java. Avoid problems related to CSS, HTML, or UI design.
${resumeText ? `Use the following resume content to tailor the problem:\n${resumeText}` : ""}
Do not include any explanation or commentary—only return the coding problem statement.
`.trim();
} else {
  prompt = `
You are an AI interviewer.
Generate one ${interviewType} interview question for the role of ${isCustomRole === "true" ? "(Custom Role)" : ""} ${role}.
${resumeText ? `Use the following resume content to tailor your question:\n${resumeText}` : ""}
The question should be relevant, clear, and based on the candidate's profile if available and must solve in 5 minutes.
Do not add any explanation or commentary.
`.trim();
};

    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const question = aiRes.data.choices?.[0]?.message?.content?.trim() || "No question generated.";
    console.log(question);

    // ✅ Ensure question is just a string
    if (typeof question !== "string") {
      throw new Error("Generated question is not a string");
    }

    const videoId = await createTalkingVideo(question);
    console.log("video id is: ");
    console.log(videoId);
    const videoUrl = await getVideoUrl(videoId);
    console.log("video url is : ");
    console.log(videoUrl);

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
          videoUrl,
        },
      ],
    });

    await interview.save();
    console.log("\u2705 Interview saved");

    res.status(201).json({
      message: "Interview created successfully",
      interview,
      question,
      videoUrl,
    });
  } catch (err) {
    console.error("\u274c Interview creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 📌 Get latest question
router.get("/generate/:id", authMiddleware, async (req, res) => {
  console.log("\ud83d\udcc5 [GET] /generate/:id =", req.params.id);

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      console.log("\u274c Interview not found");
      return res.status(404).json({ message: "Interview not found" });
    }

    const current = interview.questions[interview.questions.length - 1];
    if (!current) return res.status(400).json({ message: "No questions yet" });

    res.status(200).json({ question: current.question, videoUrl: current.videoUrl });
  } catch (err) {
    console.error("\u274c Fetch question error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Generate next unique question
router.post("/next/:id", authMiddleware, async (req, res) => {
  console.log("📅 [POST] /next/:id =", req.params.id);

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const { role, interviewType, isCustomRole } = interview;

    let resumeText = "";
    if (interview.resumePath && fs.existsSync(interview.resumePath)) {
      try {
        const fileBuffer = fs.readFileSync(interview.resumePath);
        const parsed = await pdfParse(fileBuffer);
        resumeText = parsed.text.slice(0, 1500);
        console.log("✅ Re-parsed resume for next question");
      } catch (err) {
        console.warn("⚠️ Resume re-parse failed:", err.message);
      }
    }

    const previousQuestions = interview.questions
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join("\n");

    let prompt = "";

    if (interviewType === "coding") {
      prompt = `
You are a coding interviewer.

Generate a **new and unique** coding problem for the role of ${isCustomRole ? "(Custom Role)" : ""} ${role}.

🧠 Past questions already asked:
${previousQuestions}

📄 Resume (if needed for tailoring):
${resumeText || "N/A"}

✅ Requirements:
- Avoid repeating or paraphrasing earlier questions.
- Choose a different concept, data structure, or level of difficulty.
- Clearly state the problem in a single paragraph.
-The question must be solvable using Python, Java, C++, or JavaScript. Avoid CSS, HTML, or other non-programming tasks.
-must solve in 5 minutes
- Return **only** the coding question text. Do not include explanation, solution, or difficulty label.

`.trim();
    } else {
      prompt = `
You are an AI interviewer.

Generate a **new and distinct** ${interviewType} interview question for the role of ${isCustomRole ? "(Custom Role)" : ""} ${role}.

🧠 Previously asked:
${previousQuestions}

📄 Resume (for personalization):
${resumeText || "N/A"}

✅ Instructions:
- Do NOT repeat or paraphrase earlier questions.
- Ask something different in tone, topic, or challenge.
- Use resume if useful.
--must solve in 5 minutes
- Return only the question. No comments or explanation.
`.trim();
    }

    console.log("🧠 Prompt for next question:\n", prompt);

    const aiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const newQuestionText = aiRes.data.choices?.[0]?.message?.content?.trim() || "No question generated.";
    console.log(newQuestionText);

    if (typeof newQuestionText !== "string") {
      throw new Error("Generated question is not a string");
    }

    const videoId = await createTalkingVideo(newQuestionText);
    const videoUrl = await getVideoUrl(videoId);

    const newQuestion = {
      question: newQuestionText,
      answer: "",
      score: 0,
      feedback: "",
      videoUrl,
    };

    interview.questions.push(newQuestion);
    await interview.save();
    console.log("✅ New question saved to interview");

    res.status(200).json({
      message: "New question generated",
      question: newQuestionText,
      videoUrl,
    });
  } catch (err) {
    console.error("❌ Error generating next question:", err.message);
    res.status(500).json({ message: "Server error while generating next question" });
  }
});


// 📌 Get full interview by ID
router.get("/:id", async (req, res) => {
  console.log("\ud83d\udcc5 [GET] /:id =", req.params.id);

  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      console.log("\u274c Interview not found");
      return res.status(404).json({ error: "Interview not found" });
    }

    res.json(interview);
  } catch (err) {
    console.error("\u274c Error fetching interview:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
