import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faCircleStop, faPlay, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import "./InterviewSession.css";

const InterviewSession = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hint, setHint] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [compile, setCompile] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(300);

  const timerRef = useRef(null);
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  const token = localStorage.getItem("token");
  const API = "http://localhost:8000";

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`${API}/api/interview/${interviewId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterview(res.data);
      } catch (err) {
        console.error(err);
        setError("❌ Could not load interview.");
      }
    };

    fetchInterview();
  }, [interviewId]);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const getSummary = () => {
    navigate(`/summary/${interviewId}`);
  };

  const getFeedback = async () => {
    try {
      const question = interview?.questions?.[questionIndex]?.question;

      const answer =
        interview.interviewType === "Coding"
          ? code
          : transcript;

      if (!question || !answer) {
        alert("Please answer the question first.");
        return;
      }

      const res = await axios.post(
        `${API}/api/feedback/generate/${interviewId}/${questionIndex}`,
        { question, answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(`Score: ${res.data.score}/10\n${res.data.feedback}`);

    } catch (err) {
      console.error(err);
      setFeedback("❌ Failed to get feedback.");
    }
  };

  const getHint = async () => {
    const current = interview?.questions?.[questionIndex];
    if (!current) return;

    try {
      const res = await axios.post(
        `${API}/api/feedback/hint`,
        {
          question: current.question,
          isCoding: interview.interviewType === "Coding",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHint(res.data.hint);
    } catch {
      setHint("❌ Failed to fetch hint.");
    }
  };

  const getLanguageId = (lang) => {
    const map = {
      javascript: 63,
      python: 71,
      cpp: 54,
      java: 62,
    };
    return map[lang];
  };

  const submitCode = async () => {
    try {
      const res = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
        {
          language_id: getLanguageId(language),
          source_code: btoa(code),
          stdin: "",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const result = res.data;

      if (result.stdout) setCompile(atob(result.stdout));
      else if (result.stderr) setCompile(atob(result.stderr));
      else if (result.compile_output) setCompile(atob(result.compile_output));
      else setCompile(result.status?.description || "No Output");

    } catch (err) {
      console.error(err);
      setCompile("❌ Code execution failed.");
    }
  };

  const nextQuestion = async () => {
    try {
      const res = await axios.post(
        `${API}/api/interview/next/${interviewId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInterview((prev) => ({
        ...prev,
        questions: [...prev.questions, res.data],
      }));

      setQuestionIndex((prev) => prev + 1);
      setTranscript("");
      setCode("");
      setCompile("");
      setFeedback("");
      setHint("");
      setTimer(300);

    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <div>{error}</div>;
  if (!interview?.questions?.length) return <div>Loading...</div>;

  const current = interview.questions[questionIndex];

  return (
    <div className="home-container">
      <div className="card-container">

        <div className="glass-card">
          {current.videoUrl ? (
            <video src={current.videoUrl} controls />
          ) : (
            <p>Loading video...</p>
          )}

          <h2>Question {questionIndex + 1}</h2>
          <p>{current.question}</p>

          <p>🕒 {formatTime(timer)}</p>

          <button onClick={nextQuestion}>Next</button>

          <button onClick={getHint}>
            <FontAwesomeIcon icon={faLightbulb} /> Hint
          </button>

          {hint && <p>{hint}</p>}

          <button onClick={getSummary}>End Interview</button>
        </div>

        <div className="glass-card">

          <button onClick={getFeedback}>Get Feedback</button>

          {interview.interviewType !== "Coding" ? (
            <>
              <Webcam ref={webcamRef} />

              {!isRecording ? (
                <button onClick={startListening}>
                  <FontAwesomeIcon icon={faMicrophone} /> Start
                </button>
              ) : (
                <button onClick={stopListening}>
                  <FontAwesomeIcon icon={faCircleStop} /> Stop
                </button>
              )}

              {transcript && <p>{transcript}</p>}
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
                  onChange={(v) => setCode(v || "")}
                />
              </Suspense>

              <button onClick={submitCode}>
                <FontAwesomeIcon icon={faPlay} /> Run Code
              </button>

              {compile && <pre className="compile-box">{compile}</pre>}
            </>
          )}

          {feedback && (
            <pre className="feedback-box">{feedback}</pre>
          )}

        </div>

      </div>
    </div>
  );
};

export default InterviewSession;