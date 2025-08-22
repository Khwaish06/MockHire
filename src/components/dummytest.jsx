import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faCircleStop, faPlay, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import "./InterviewSession.css";

const InterviewSession = () => {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hint, setHint] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [output, setOutput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [feed, setFeed] = useState({ score: 0, feed: "", total: 10 });
  const [compile, setCompile] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(300);
  const timerRef = useRef(null);
 
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/interview/${interviewId}`, {
          headers: { Authorization: `Bearer ${token}` },
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
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer((prev) => prev - 1), 1000);
    } else {
      clearTimeout(timerRef.current);
    }
    return () => clearTimeout(timerRef.current);
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
      setOutput(text);
    };
    recognition.onerror = (e) => console.error("Speech error:", e.error);
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript(""); // clear old transcript
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const getSummary = () => {
    navigate(`/summary/${interviewId}`);
  };

  const getFeedback = async () => {
  clearTimeout(timerRef.current);
  console.log(interview?.questions?.[questionIndex].question);
  console.log(output);
  console.log(token);
  console.log(questionIndex);
  console.log(interviewId);

  try {
    const res = await axios.post(
      `http://localhost:8000/api/feedback/generate/${interviewId}/${questionIndex}`,
      {
        question: interview?.questions?.[questionIndex].question,
        answer: output
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log(res.data);
    console.log(res.data.score);
    console.log(res.data.feedback);
    setFeed({
      score: res.data.score,
      feed: res.data.feedback,
      total: 10,
    });
  } catch (err) {
    console.error("Error getting feedback:", err.response?.data || err.message);
  }
};
  const getHint = async () => {
    const current = interview?.questions?.[questionIndex];
    if (!current) return;

    try {
      const res = await axios.post(
        `http://localhost:8000/api/feedback/hint`,
        { question: current.question, isCoding: interview.interviewType === "Coding" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setHint(res.data.hint || "💡 Hint not available.");
    } catch (err) {
      console.error("Hint error:", err);
      setHint("❌ Failed to fetch hint.");
    }
  };

 const submitCode = async () => {
   const languageVersions = {
  python: "3.10.0",
  javascript: "18.15.0",
  java: "17.0.8",
  c: "10.2.0",
  cpp: "10.2.0",
  // Add more as needed
};

  console.log(code);
  console.log(language);
  setOutput(code); // Optional: display code in UI
    const selectedLanguage = language || "javascript";
  const selectedVersion = languageVersions[selectedLanguage];

  try {
    const payload = {
      language: language, // fallback to python if undefined
     version:selectedVersion,
      files: [{ name: "main.txt", content: code }],
    };

    const res = await axios.post("https://emkc.org/api/v2/piston/execute", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.data.run.code !== 0) {
      setCompile("❌ Compilation error:\n" + res.data.run.stderr);
    } else {
      setCompile(res.data.run.stdout || "✅ Success! (no output)");
    }
  } catch (err) {
    console.error("Axios Error:", err.response?.data || err.message);
    setCompile("❌ Submission failed.");
  }
};


  const nextQuestion = async () => {
    try {
      const res = await axios.post(
        `http://localhost:8000/api/interview/next/${interviewId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
            feedback: "",
          },
        ],
      }));

      setQuestionIndex((prev) => prev + 1);
      setTranscript("");
      setCode("");
      setOutput("");
      setHint("");
      setFeed({ score: 0, feed: "", total: 10 });
      setTimer(300);
    } catch (err) {
      console.error("❌ Failed to fetch next question", err);
      setError("❌ Could not load next question.");
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
            <video src={current.videoUrl} controls />
          ) : (
            <p>Loading video...</p>
          )}
          <h2>Question {questionIndex + 1}</h2>
          <p>{current.question}</p>
          <p>🕒 Time Left: {formatTime(timer)}</p>

          <button className="start-btn" onClick={nextQuestion} disabled={isRecording}>
            Next
          </button>

          <button className="Hint" onClick={getHint}>
            <FontAwesomeIcon icon={faLightbulb} /> Hint
          </button>
          {hint && <p>{hint}</p>}

          <button onClick={getSummary}>End Interview & Generate Summary</button>
        </div>

        <div className="glass-card">
          <button onClick={getFeedback}>Get Feedback</button>
          {feed.feed && (
            <div>
              <p>Score: {feed.score}/{feed.total}</p>
              <p>Feedback: {feed.feed}</p>
            </div>
          )}

          {interview.interviewType !== "Coding" ? (
            <>
              <Webcam ref={webcamRef} className="webcam" />
              <div className="mic-controls">
                {!isRecording ? (
                  <button onClick={startListening}>
                    <FontAwesomeIcon icon={faMicrophone} /> Start Answering
                  </button>
                ) : (
                  <button onClick={stopListening}>
                    <FontAwesomeIcon icon={faCircleStop} /> Stop Answering
                  </button>
                )}
              </div>
              {!isRecording && transcript && <p>{transcript}</p>}
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
              <button onClick={submitCode}>
                <FontAwesomeIcon icon={faPlay} /> Run Code
              </button>
              {compile && <p>{compile}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
