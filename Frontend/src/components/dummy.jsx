
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./interviewSession.css";

const InterviewSession = () => {
  const { interviewId } = useParams();
  const API = import.meta.env.VITE_BACKEND_URL;

  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(300);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [summary, setSummary] = useState("");
  const [isOutputVisible, setIsOutputVisible] = useState(false);
  const [transcript, setTranscript] = useState("");

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`${API}/api/interview/${interviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterview(res.data);
      } catch (err) {
        console.error("Interview fetch error:", err);
        setError("❌ Could not load interview.");
      }
    };

    if (API && token) fetchInterview();
  }, [interviewId, API, token]);

  useEffect(() => {
    if (!interview) return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [interview]);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser doesn't support speech recognition");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (e) => console.error("Speech error:", e.error);

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopListening = async () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    await submitAnswer(transcript, false);
  };

  const getLanguageId = (lang) => {
    const map = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62
    };
    return map[lang] || 63;
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput("⚠️ Please enter some code before running.");
      setIsOutputVisible(true);
      return;
    }

    try {
      const res = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
        {
          language_id: getLanguageId(language),
          source_code: btoa(code),
          stdin: ""
        }
      );

      const result = res.data;

      if (result.stdout) {
        setOutput(atob(result.stdout));
      } else if (result.stderr) {
        setOutput(atob(result.stderr));
      } else if (result.compile_output) {
        setOutput(atob(result.compile_output));
      } else if (result.status) {
        setOutput(result.status.description);
      } else {
        setOutput("⚠️ No output returned.");
      }

      setIsOutputVisible(true);

    } catch (err) {
      console.error("❌ Judge0 error:", err.response?.data || err.message);
      setOutput("❌ Failed to execute code.");
      setIsOutputVisible(true);
    }
  };

  const fetchHint = async () => {
    const current = interview?.questions?.[questionIndex];
    if (!current) return;

    try {
      const res = await axios.post(
        `${API}/api/feedback/hint`,
        { question: current.question },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setHint(res.data.hint || "💡 Hint not available.");
    } catch (err) {
      console.error("Hint error:", err);
      setHint("❌ Failed to fetch hint.");
    }
  };

  const submitAnswer = async (answer, isCoding) => {
    const question = interview?.questions?.[questionIndex]?.question;
    if (!question) return;

    try {
      await axios.post(
        `${API}/api/feedback/generate/${interviewId}/${questionIndex}`,
        {
          question,
          answer,
          codeOutput: isCoding ? output : "",
          isCoding
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(
        `${API}/api/feedback/summary/${interviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSummary(res.data.aiFeedback);
    } catch (err) {
      console.error("Summary fetch error:", err);
      setSummary("❌ Failed to generate summary.");
    }
  };

  if (error) return <div className="error-box">{error}</div>;
  if (!interview?.questions?.length) return <div>⏳ Loading interview...</div>;

  const current = interview.questions[questionIndex];

  return (
    <div className="home-container">
      <div className="card-container">

        <div className="glass-card">
          {current.videoUrl ? (
            <video src={current.videoUrl} controls autoPlay muted />
          ) : (
            <p>Loading video...</p>
          )}

          <h2>Question {questionIndex + 1}</h2>
          <p>{current.question}</p>

          <p className="timer">
            ⏱️ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
          </p>

          <button className="hint-btn" onClick={fetchHint}>
            💡 Hint
          </button>

          {hint && <div className="hint-box">{hint}</div>}

          <button
            className="start-btn"
            onClick={async () => {

              if (questionIndex < interview.questions.length - 1) {
                setQuestionIndex((prev) => prev + 1);
                setTranscript("");
                setCode("");
                setOutput("");
                setHint("");
                setTimer(300);
                setIsOutputVisible(false);
                return;
              }

              try {
                const res = await axios.post(
                  `${API}/api/interview/next/${interviewId}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                setInterview((prev) => ({
                  ...prev,
                  questions: [
                    ...prev.questions,
                    {
                      question: res.data.question,
                      videoUrl: res.data.videoUrl,
                      answer: "",
                      score: 0,
                      feedback: ""
                    }
                  ]
                }));

                setQuestionIndex((prev) => prev + 1);
                setTranscript("");
                setCode("");
                setOutput("");
                setHint("");
                setTimer(300);
                setIsOutputVisible(false);

              } catch (err) {
                console.error("❌ Failed to fetch next question", err);
                setError("❌ Could not load next question.");
              }

            }}
            disabled={isRecording}
          >
            Next
          </button>

          <button className="start-btn summary-btn" onClick={fetchSummary}>
            📋 Generate Summary
          </button>

          {summary && (
            <div className="summary-box">
              <h3>📝 AI Summary:</h3>
              <p>{summary}</p>
            </div>
          )}
        </div>


        <div className="glass-card">
          {interview.interviewType !== "Coding" ? (
            <>
              <Webcam ref={webcamRef} className="webcam" />

              <div className="mic-controls">
                {!isRecording ? (
                  <button onClick={startListening}>
                    🎤 Start Answering
                  </button>
                ) : (
                  <button onClick={stopListening}>
                    🛑 Stop
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              <Suspense fallback={<div>Loading editor...</div>}>
                <Editor
                  height="300px"
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                />
              </Suspense>

              <button className="start-btn" onClick={runCode}>
                ▶️ Run Code
              </button>

              {isOutputVisible && (
                <div className="output-section">
                  <h3>🖨 Output:</h3>
                  <pre>{output}</pre>
                </div>
              )}

              <button
                className="start-btn"
                onClick={() => submitAnswer(code, true)}
              >
                📤 Get Feedback
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default InterviewSession;

