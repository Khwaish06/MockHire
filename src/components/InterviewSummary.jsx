// src/components/InterviewSummary.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./interviewsummary.css";

const InterviewSummary = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [totalScore, setTotalScore] = useState(0);
  const [aiFeedback, setAiFeedback] = useState("");
  const [ques,setQues]=useState(0);

  useEffect(() => {
  const fetchSummary = async () => {
    const token = localStorage.getItem("token"); // ✅ Grab token from localStorage
    if (!token) {
      console.error("❌ No auth token found");
      return;
    }

    try {
      const res = await axios.get(`http://localhost:8000/api/feedback/summary/${ interviewId }`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Auth header
      });

      setTotalScore(res.data.totalScore || 0);
      setAiFeedback(res.data.aiFeedback || "");
      setQues(res.data.totalQuestions || 0);
    } catch (err) {
      console.error("❌ Error fetching summary:", err.response?.data || err.message);
    }
  };

  fetchSummary();
}, [interviewId]);

  
  const getScoreColor = () => {
    if (totalScore >= 8*ques) return "green";
    if (totalScore >= 5*ques) return "yellow";
    return "red";
  };

  return (
    <div className="home-container">
      <div className="glass-card summary-card">
        <h1 className="main-title">Interview Summary</h1>

        <div className={`score-circle ${getScoreColor()}`}>
          <span className="score-value">{totalScore}</span>
          <span className="score-label">Total Score</span>
        </div>

        <div className="ai-feedback-box">
          <h3>AI Feedback</h3>
          <p>{aiFeedback}</p>
        </div>

        <button className="back-btn" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default InterviewSummary;
