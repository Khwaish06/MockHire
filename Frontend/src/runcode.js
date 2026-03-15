const axios = require("axios");

const code = `
print("Hello from Python")
`;

const payload = {
  language: "python",
  version: "3.10.0",
  files: [
    {
      name: "main.txt",
      content: code,
    },
  ],
};

(async () => {
  try {
    const res = await axios.post("https://emkc.org/api/v2/piston/execute", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.data.run.code !== 0) {
      console.log("❌ Compilation error:\n" + res.data.run.stderr);
    } else {
      console.log("✅ Output:\n" + res.data.run.stdout);
    }
  } catch (err) {
    console.error("Axios Error:", err.response?.data || err.message);
  }
})();
