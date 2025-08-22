import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./interviewSession.css";

const InterviewSession = () => {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(300);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  const token = localStorage.getItem("token");

  // Fetch interview
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`/api/interview/${interviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterview(res.data);
      } catch (err) {
        console.error("Interview fetch error:", err);
        setError("❌ Could not load interview.");
      }
    };
    fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    if (!interview) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [interview]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support speech recognition");

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

  const submitAnswer = async (answer, isCoding) => {
    const question = interview?.questions?.[questionIndex]?.question;
    if (!question) return;

    try {
      const res = await axios.post(
        `/api/interview/generate/${interviewId}/${questionIndex}`,
        {
          question,
          answer,
          codeOutput: isCoding ? output : "",
          isCoding,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setFeedback(res.data.feedback || "✅ Feedback received");
    } catch (err) {
      console.error("Feedback error:", err);
      setFeedback("❌ Feedback error");
    }
  };

  const runCode = async () => {
    const encodedCode = btoa(code); // Judge0 requires base64
    try {
      const res = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        {
          language_id: getLanguageId(language),
          source_code: encodedCode
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "b6ab2f68b4msha18fd1b7d2084dep15b1d5jsn5b792062e892", // ← Replace with real key
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
          }
        }
      );
      setOutput(atob(res.data.stdout || "") || "No Output");
    } catch (err) {
      console.error("Judge0 Error", err);
      setOutput("❌ Error running code.");
    }
  };

  const getLanguageId = (lang) => {
    const map = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62
    };
    return map[lang];
  };

  if (error) return <div className="error-box">{error}</div>;
  if (!interview?.questions?.length) return <div>⏳ Loading interview...</div>;

  const current = interview.questions[questionIndex];
  const videoUrl = current.videoUrl;
  const currentQuestion = current.question;
  const isCoding = interview.interviewType === "Coding";

  return (
    <div className="interview-session-container">
      <div className="card left-card">
        {videoUrl ? (
          <video src={videoUrl} controls autoPlay muted />
        ) : (
          <p>Waiting for video...</p>
        )}
        <h2>Question {questionIndex + 1}</h2>
        <p>{currentQuestion}</p>
        <p className="timer">
          ⏱️ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
        </p>

        <button
          onClick={() => {
            if (questionIndex < interview.questions.length - 1) {
              setQuestionIndex((prev) => prev + 1);
              setTranscript("");
              setFeedback("");
              setCode("");
              setOutput("");
              setTimer(300);
            }
          }}
          disabled={questionIndex >= interview.questions.length - 1}
        >
          Next
        </button>

        <button
          onClick={async () => {
            try {
              const res = await axios.get(`/api/interview/summary/${interviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              alert("📄 Summary:\n" + JSON.stringify(res.data.summary, null, 2));
            } catch {
              alert("❌ Error generating summary");
            }
          }}
        >
          📄 Generate Summary
        </button>
      </div>

      <div className="card right-card">
        {!isCoding ? (
          <>
            <Webcam ref={webcamRef} className="webcam" />
            <div className="mic-controls">
              {!isRecording ? (
                <button onClick={startListening}>🎤 Start Answering</button>
              ) : (
                <button onClick={stopListening}>🛑 Stop</button>
              )}
            </div>

            <div className="feedback-box">
              <h3>Transcript</h3>
              <p>{transcript}</p>
              <h3>Feedback</h3>
              <p>{feedback}</p>
            </div>
          </>
        ) : (
          <>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
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

            <button onClick={runCode}>▶️ Run Code</button>

            <div className="output-box">
              <h3>🧪 Output</h3>
              <pre>{output}</pre>
            </div>

            <button onClick={() => submitAnswer(code, true)}>✅ Submit</button>

            <div className="feedback-box">
              <h3>💬 Feedback</h3>
              <p>{feedback}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewSession;
