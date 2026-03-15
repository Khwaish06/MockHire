const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/run", async (req, res) => {
  try {
    const { language, code } = req.body;

    const response = await axios.post("https://piston.rs/api/v2/execute", {
      language,
      version: "*",
      files: [
        {
          content: code
        }
      ]
    });

    res.json(response.data);

  } catch (error) {
    console.error("Compiler error:", error.response?.data || error.message);
    res.status(500).json({ error: "Code execution failed" });
  }
});

module.exports = router;